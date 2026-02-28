# QAi — Phase 3: Claude AI Testing Agent + Live Test View

> Completed February 28, 2026
> Live at: https://qai.itzdevoo.com
> Worker at: https://qai-worker-production.up.railway.app

---

## What Was Built

Phase 3 adds **Layer 2: AI behavioral testing** — Claude Sonnet analyzes screenshots of each page, decides what to click/test next, and reports issues like a senior QA engineer. This is the core differentiator that makes QAi more than an automated link checker.

The AI runs after deterministic checks complete. Standard mode runs the AI loop 3 times for consistency; fast mode runs once. Issues are deduplicated across runs and assigned confidence scores.

---

## Architecture

```
Worker receives job
  ↓
1. Deterministic checks (Phase 2 — unchanged)
  ↓
2. AI Loop (NEW):
   Screenshot → Claude Sonnet → JSON action → Playwright executes → repeat (max 20 steps)
   Each step → POST /api/webhooks/worker/step → stored in ai_steps table
  ↓
3. Consistency check: Standard mode runs AI 3x, deduplicates issues found in 2+ runs
  ↓
4. Final callback with all issues (deterministic + AI) + confidence scores
```

**Communication:** Worker sends per-step webhook callbacks to Next.js. Frontend polls every 1.5s and renders a live step feed during AI execution.

---

## Database Changes

### New Table: `ai_steps`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| test_run_id | UUID | FK → test_runs.id, CASCADE |
| run_number | INTEGER | 1-3 (which consistency run) |
| step_number | INTEGER | 1-20 (sequential within run) |
| action | TEXT | click, type, navigate, scroll, assert_error, thinking, done |
| description | TEXT | Human-readable step description |
| selector | TEXT | Nullable — CSS selector for click/type |
| input_value | TEXT | Nullable — value for type actions |
| screenshot_base64 | TEXT | Nullable — reserved for Phase 4 |
| ai_reasoning | TEXT | Nullable — Claude's reasoning |
| status | ENUM | pending, executing, completed, failed |
| created_at | TIMESTAMP | Default now() |

### Modified: `test_runs` — new columns
| Column | Type | Notes |
|---|---|---|
| current_run_number | INTEGER | 0=deterministic, 1-3=AI runs |
| total_steps | INTEGER | AI steps completed so far |
| last_step_description | TEXT | Latest step for cheap polling |

### Modified: `issue_category` enum — added `"ai_detected"`

### Modified: `issues` table — added `confidence` (text, nullable)

---

## Worker Changes

### New Files: `qai-worker/src/ai/`

| File | Purpose |
|---|---|
| `types.ts` | ClaudeAction, AiIssue, ConfirmedIssue, StepUpdate interfaces |
| `prompts.ts` | System prompt, Claude API call with vision, response parser |
| `actions.ts` | Execute Playwright actions (click, type, navigate, scroll) |
| `runner.ts` | Core 20-step AI loop: screenshot → Claude → action → repeat |
| `consistency.ts` | 3-run deduplication + confidence scoring |

### AI Loop Flow (`runner.ts`)
1. Take screenshot (PNG)
2. Get page metadata (URL, title)
3. Send screenshot + metadata to Claude Sonnet via vision API
4. Claude returns structured JSON action
5. Report step via webhook callback
6. If `done` → break
7. If `assert_error` → record issue, continue
8. Execute Playwright action (click/type/navigate/scroll)
9. Wait for page to settle
10. Repeat (max 20 steps)

### Claude Integration (`prompts.ts`)
- **Model:** claude-sonnet-4-20250514
- **System prompt:** Senior QA engineer role, systematic exploration, structured JSON responses
- **Vision:** Screenshot sent as base64 image at each step
- **History:** Last 3 conversation exchanges kept for context (cost control)
- **Response format:** `{ action, selector, value, url, direction, description, reasoning, severity }`

### Consistency Check (`consistency.ts`)
- **Fast mode (1 run):** All AI issues get "low" confidence
- **Standard mode (3 runs):** Issues found in 2+ runs are confirmed
  - Found in 3/3 → "high" confidence
  - Found in 2/3 → "medium" confidence
  - Found in 1/3 → filtered out (noise)
- Deduplication uses normalized string matching on descriptions

### Modified: `/run` endpoint (`index.ts`)
1. Run deterministic checks (unchanged)
2. Launch browser for AI loop
3. Run AI loop 1x (fast) or 3x (standard)
4. Deduplicate AI issues
5. Combine deterministic + AI issues
6. Send final callback with all issues + confidence

### Step Callbacks
- Worker sends per-step webhooks to `/api/webhooks/worker/step`
- Strips screenshot data from callbacks (too large for per-step transfer)
- Each step inserts into `ai_steps` table and updates `testRuns.lastStepDescription`

---

## API Route Changes

### New: `POST /api/webhooks/worker/step/route.ts`
- Validates x-api-key
- Inserts AI step into `ai_steps` table
- Updates `testRuns` with currentRunNumber, totalSteps, lastStepDescription

### New: `GET /api/test-runs/[id]/steps/route.ts`
- Returns all AI steps for a test run (without screenshot data)
- Ordered by runNumber, stepNumber

### Modified: `POST /api/webhooks/worker/route.ts`
- Handles `ai_detected` category
- Passes through `confidence` field to issues table

---

## Frontend Changes

### `usePollTestRun` hook
- Added `currentRunNumber`, `totalSteps`, `lastStepDescription` to TestRunData
- Added `confidence` to Issue interface
- Polling interval: 1.5s (faster for AI step updates)

### New: `LiveStepFeed` component
- Polls `/api/test-runs/[id]/steps` every 2s while running
- Shows scrolling log of AI actions with step numbers (run.step format)
- Action icons: click (mouse), type (keyboard), navigate (globe), scroll (arrow), assert_error (alert), thinking (brain)
- Color coding: red for errors/assertions, blue for active, gray for completed
- Auto-scrolls to bottom as new steps arrive

### Report Page (`/test/[id]`)
- **Running state:** Shows "AI Run X of Y" progress, latest step description, LiveStepFeed
- **Completed state:** Issues grouped by category, AI issues show confidence badge
- **Confidence badges:** high (red), medium (secondary), low (outline)
- **"View AI test steps"** collapsible section shows full step timeline after completion
- **Failed state:** Shows step history even on failure

---

## Environment Variables

### Railway (worker) — added:
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Cost Profile

| Item | Cost |
|---|---|
| 20-step AI run (fast mode) | ~$0.10-0.20 |
| Standard mode (3 runs × 20 steps) | ~$0.30-0.60 |
| User charge: Standard $0.30, Fast $0.15 | Healthy margin |

---

## E2E Verification Results

Tested against `https://example.com` in fast mode:
- **20 AI steps** completed in 157.2 seconds
- AI navigated from example.com through IANA, RFC docs, domain registries
- **1 AI-detected issue:** "Navigation links are not working — multiple clicks on different links have failed to navigate away from the current page"
- Confidence: "low" (correct for fast mode / 1 run)
- Credits correctly deducted (10 → 9 for fast mode)
- Live step feed populated in real-time during execution
- Deterministic checks passed (example.com is a simple page)

---

## Known Limitations

- **AI wanders off-domain:** Claude sometimes follows links to external sites despite prompt instructions. Can be tightened in prompt tuning.
- **Screenshots not stored:** The AI captures screenshots at each step but they're not saved to DB or displayed. Reserved for Phase 4 (screenshot viewer).
- **Selector timeouts:** Claude guesses CSS selectors that don't always match. Failed actions don't crash the run but do waste steps.
- **157s for 20 steps:** Each step requires a Claude API round-trip (~5-7s). Standard mode with 3 runs would take ~8 minutes. Acceptable for async testing.

---

## What's NOT Built Yet (Phase 4+)

- Screenshot viewer (see what AI saw at each step)
- False positive button on issues
- Coverage summary (pages visited, actions tested)
- Prompt tuning (keep AI on-domain, better selector strategies)
- Screenshot storage (Cloudflare R2)
- Stripe payment flows
- Settings page
