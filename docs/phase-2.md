# QAi — Phase 2: Testing Engine & Deterministic Checks

> Completed February 28, 2026
> Live at: https://qai.itzdevoo.com
> Worker at: https://qai-worker-production.up.railway.app

---

## What Was Built

Phase 2 makes QAi functional — users can submit a URL and receive a real bug report powered by 5 Playwright-based deterministic checks. The architecture uses a fire-and-forget pattern: Next.js dispatches jobs to a Docker-containerized Playwright worker on Railway, which runs checks and posts results back via webhook. The frontend polls for updates until completion.

---

## Architecture Overview

```
User → "Run Test" → POST /api/test-runs → INSERT DB → POST worker/run (fire & forget)
                                                              ↓
User → /test/[id] → polls GET /api/test-runs/[id]    Worker runs Playwright checks
                              ↑                               ↓
                              └── POST /api/webhooks/worker ←─┘
                                  (updates DB with results)
```

- **Vercel** hosts the Next.js app + API routes
- **Railway** hosts the Playwright worker in Docker
- Communication: HTTP POST to dispatch, webhook callback for results
- Frontend polls every 2.5s until test completes/fails

---

## New Infrastructure

| Service | Purpose | Status |
|---|---|---|
| **Railway** | Playwright worker hosting (Docker) | Deployed |
| **GitHub** | `ItzDevoo/qai-worker` repo | Connected to Railway auto-deploy |

---

## Database Changes

### New: `issues` table
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| test_run_id | UUID | FK → test_runs.id, CASCADE delete |
| category | ENUM | broken_link, console_error, broken_image, accessibility, performance |
| severity | ENUM | error, warning, info |
| message | TEXT | Human-readable description |
| selector | TEXT | Nullable — CSS selector if applicable |
| context | TEXT | Nullable — extra detail (URL, element info) |
| created_at | TIMESTAMP | Default now() |

### Modified: `test_runs` table (new columns)
| Column | Type | Notes |
|---|---|---|
| mobile_viewport | BOOLEAN | Default false |
| duration_ms | INTEGER | Nullable — set by worker on completion |

### New: Drizzle relations
- `users` ↔ `testRuns` (one-to-many)
- `users` ↔ `credits` (one-to-one)
- `testRuns` ↔ `issues` (one-to-many)

---

## New Files (Next.js App)

### API Routes

| Route | Method | Purpose |
|---|---|---|
| `src/app/api/test-runs/route.ts` | POST | Create test run, deduct credits, dispatch to worker |
| `src/app/api/test-runs/[id]/route.ts` | GET | Fetch test run + issues (frontend polls this) |
| `src/app/api/webhooks/worker/route.ts` | POST | Receive results from Railway worker, refund on failure |
| `src/app/api/credits/route.ts` | GET | Return user's credit balance (sidebar uses this) |

### Pages

| File | Purpose |
|---|---|
| `src/app/(app)/test/[id]/page.tsx` | Report page — polls for results, shows issues grouped by category |
| `src/app/(app)/test/new/page.tsx` | **Modified** — wired to POST /api/test-runs, redirects to report |
| `src/app/(app)/dashboard/page.tsx` | **Modified** — real DB queries, real stats, real test run list |
| `src/app/(app)/history/page.tsx` | **Modified** — real test run list from DB (limit 50) |

### Library & Hooks

| File | Purpose |
|---|---|
| `src/lib/queries.ts` | DB query helpers: getOrCreateUser, credits CRUD, test run queries |
| `src/hooks/use-poll-test-run.ts` | Polls GET /api/test-runs/[id] every 2.5s until completed/failed |

---

## Key Business Logic

### User Sync (`getOrCreateUser`)
- On first API call, upserts user from Clerk into `users` table
- Automatically creates `credits` row with **3 free credits**
- Idempotent — safe to call on every request

### Credit System
- **Standard mode**: 2 credits per test
- **Fast mode**: 1 credit per test
- Atomic deduction: `WHERE balance >= cost` prevents negative balances
- **Auto-refund** on worker failure via webhook handler

### Job Dispatch
- `POST /api/test-runs` creates a DB row, then fire-and-forgets to the worker
- Worker acknowledges immediately (HTTP 200), runs checks async
- Worker posts status updates back via `POST /api/webhooks/worker`
- API key shared between Vercel and Railway for mutual authentication

---

## Worker Service (`qai-worker`)

Separate Express server running Playwright in a Docker container on Railway.

### File Structure
```
qai-worker/
├── Dockerfile                    # FROM mcr.microsoft.com/playwright:v1.58.2-noble
├── package.json
├── tsconfig.json                 # ES2022 + DOM lib, commonjs output
├── .env.example
└── src/
    ├── index.ts                  # Express server, POST /run, GET /health
    ├── runner.ts                 # Orchestrates all 5 checks
    ├── types.ts                  # Issue, RunOptions, RunResult, JobPayload
    └── checks/
        ├── performance.ts        # Time page.goto(), flag if > 3s
        ├── console-errors.ts     # Listen to console events, collect errors/warnings
        ├── broken-images.ts      # Query <img>, check naturalWidth === 0
        ├── accessibility.ts      # Missing alt text, unlabeled buttons/inputs
        └── broken-links.ts       # Same-origin <a href>, HEAD request each (max 20)
```

### Check Details

| Check | What It Does | Severity |
|---|---|---|
| **Performance** | Times `page.goto()`, flags if > 3s. If page fails to load, returns error and skips remaining checks. | error/warning |
| **Console Errors** | Listens to `page.on('console')` and `page.on('pageerror')` events. Collects errors and warnings. | error/warning |
| **Broken Images** | Finds all `<img>` elements, checks `naturalWidth === 0` for loaded images. | warning |
| **Accessibility** | Checks: images without alt text, buttons without text/aria-label, inputs without labels/aria-label. | warning |
| **Broken Links** | Finds same-origin `<a href>` links (max 20), sends HEAD requests, flags 4xx/5xx responses. | error/warning |

### Execution Flow
1. Set up console listener (before navigation)
2. Navigate to URL (performance check)
3. If page load failed → return early with error
4. Wait for `networkidle`
5. Run broken-links, broken-images, accessibility in **parallel**
6. Collect console issues
7. Return all issues + duration

### Docker
- Base: `mcr.microsoft.com/playwright:v1.58.2-noble` (includes Chromium)
- Install pnpm via `npm install -g pnpm` (corepack has signature issues)
- Build TypeScript → `dist/`
- Entry: `node dist/index.js`
- Port: 3001

---

## Frontend Changes

### Report Page (`/test/[id]`)
- **Polling**: `usePollTestRun` hook polls every 2.5s
- **Queued/Running**: Animated spinner with "Waiting for worker..." / "Running checks..."
- **Completed**: Summary stats (issues found, duration, categories flagged) + issues grouped by category
- **Failed**: Error message with "Credits have been refunded" + retry link
- **Zero issues**: "All Checks Passed" success state
- Each issue shows severity badge (error=red, warning=secondary, info=outline), message, and optional context

### New Test Page (`/test/new`)
- URL input with auto-protocol prefixing (`https://` if missing)
- Run Test button → POST /api/test-runs → redirect to /test/[id]
- Error handling: 402 (insufficient credits), 400 (invalid URL)
- Loading state on button during submission
- Advanced options: Fast Mode toggle, Mobile Viewport toggle

### Dashboard (`/dashboard`)
- **Server component** with real DB queries
- Stats: total tests, total issues found, average duration
- Recent test runs list (limit 10)
- Empty state with "Run Your First Test" CTA

### History (`/history`)
- **Server component** with real test run list (limit 50)
- Each card links to `/test/[id]`
- Empty state for new users

### Sidebar (`app-sidebar.tsx`)
- Fetches real credit balance from `/api/credits` on each navigation

---

## Environment Variables (New)

### Vercel (added)
```
WORKER_URL=https://qai-worker-production.up.railway.app
WORKER_API_KEY=qai-dev-secret-key-change-in-production
```

### Railway (worker)
```
WORKER_API_KEY=qai-dev-secret-key-change-in-production
CALLBACK_URL=https://qai.itzdevoo.com/api/webhooks/worker
PORT=3001
```

---

## Bugs Fixed During Phase 2

| Bug | Cause | Fix |
|---|---|---|
| Corepack signature verification failed in Docker | Playwright Docker image's corepack had key mismatch | Replaced `corepack enable` with `npm install -g pnpm` |
| Playwright version mismatch in Docker | `pnpm install` got v1.58.2 but Docker image was v1.50.0 | Updated Dockerfile to `v1.58.2-noble` |
| TypeScript DOM errors in worker | `$eval` callbacks use browser APIs but tsconfig lacked DOM lib | Added `"DOM"` to tsconfig `lib` array |
| HTMLInputElement type errors | `.type` and `.name` on elements need explicit casting | Added `(input as HTMLInputElement)` casts |
| @clerk/themes missing | Root layout imported `dark` theme but package wasn't installed | `pnpm add @clerk/themes` |

---

## E2E Verification Results

QAi tested itself at `https://qai.itzdevoo.com`:

- **2 issues found** in 3.1 seconds
- Accessibility warning: hidden Clerk button with no accessible name
- Console warning: Clerk publishable key for development detected
- Credits correctly deducted (3 → 1 for standard mode)
- Dashboard updated with real data
- History page shows all test runs

---

## What's NOT Built Yet (Phase 3+)

- No AI analysis (Layer 2 — LLM-powered visual/UX checks)
- No screenshot storage (Cloudflare R2)
- No real-time updates (currently polling, not SSE)
- No Stripe payment flows (skeleton only)
- No settings page
- No admin dashboard
- No rate limiting
- Worker API key is development placeholder (needs rotation for production)
- Stuck test runs have no cleanup mechanism (no timeout/expiry)
