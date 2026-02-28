# QAi — Phase 1: Project Setup & App Shell

> Completed February 28, 2026
> Live at: https://qai.itzdevoo.com

---

## What Was Built

Phase 1 delivers a working app shell with authentication, database schema, UI framework, dark theme, and production deployment. No testing logic yet — just a solid, deployed skeleton.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | v4.2.1 |
| Components | shadcn/ui (New York style) | 3.8.5 |
| Auth | Clerk | 6.39.0 |
| Database | Neon (Postgres) + Drizzle ORM | 0.45.1 |
| Payments | Stripe (skeleton) | 20.4.0 |
| Animations | Framer Motion | 12.34.3 |
| Icons | Lucide React | 0.575.0 |
| Fonts | Geist Sans + Mono | via next/font |
| Package Manager | pnpm | 10.14.0 |

---

## Infrastructure

| Service | Purpose | Status |
|---|---|---|
| **Vercel** | Frontend + API hosting | Deployed |
| **Neon** | Postgres database (via Vercel Storage) | Connected, schema pushed |
| **Clerk** | Authentication (GitHub + Google OAuth) | Working |
| **Cloudflare** | DNS — CNAME `qai` → `cname.vercel-dns.com` | Configured |
| **Stripe** | Payment processing | Skeleton only (webhook stub) |
| **GitHub** | Source control — github.com/ItzDevoo/QAi | Connected to Vercel auto-deploy |

---

## Directory Structure

```
qai/
├── docs/
│   └── phase-1.md                  # This file
├── drizzle.config.ts               # Drizzle-kit config (loads .env.local)
├── .env.local.example              # Required env vars template
├── components.json                 # shadcn/ui config (new-york, zinc, lucide)
├── package.json
└── src/
    ├── app/
    │   ├── layout.tsx              # Root: ClerkProvider, Geist fonts, dark theme
    │   ├── page.tsx                # Redirects → /dashboard
    │   ├── globals.css             # QAi color palette + Tailwind theme
    │   ├── (auth)/
    │   │   ├── sign-in/[[...sign-in]]/page.tsx
    │   │   └── sign-up/[[...sign-up]]/page.tsx
    │   ├── (app)/
    │   │   ├── layout.tsx          # Sidebar + mobile nav wrapper
    │   │   ├── dashboard/page.tsx  # Stats cards + recent test runs
    │   │   ├── test/new/page.tsx   # URL input + advanced options
    │   │   └── history/page.tsx    # Empty state placeholder
    │   └── api/
    │       └── webhooks/stripe/route.ts  # Webhook stub
    ├── components/
    │   ├── ui/                     # 11 shadcn components
    │   │   ├── avatar.tsx
    │   │   ├── badge.tsx
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── input.tsx
    │   │   ├── separator.tsx
    │   │   ├── sheet.tsx
    │   │   ├── sidebar.tsx
    │   │   ├── skeleton.tsx
    │   │   └── tooltip.tsx
    │   ├── app-sidebar.tsx         # Nav, credits, user menu
    │   ├── mobile-nav.tsx          # Bottom tab bar (<768px)
    │   └── test-run-card.tsx       # Status badge, URL, issue count
    ├── db/
    │   ├── index.ts                # Neon connection via drizzle
    │   └── schema.ts              # users, testRuns, credits tables
    ├── hooks/
    │   └── use-mobile.ts           # shadcn mobile detection hook
    ├── lib/
    │   ├── stripe.ts               # Lazy-initialized Stripe client
    │   └── utils.ts                # cn() utility from shadcn
    └── middleware.ts               # Clerk auth — protects all routes except auth + webhooks
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| clerk_id | TEXT | Unique, from Clerk |
| email | TEXT | Required |
| name | TEXT | Optional |
| created_at | TIMESTAMP | Default now() |

### `test_runs`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → users.id |
| url | TEXT | URL being tested |
| status | ENUM | queued / running / completed / failed |
| mode | ENUM | standard / fast |
| issue_count | INTEGER | Default 0 |
| created_at | TIMESTAMP | Default now() |
| completed_at | TIMESTAMP | Nullable |

### `credits`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → users.id, unique |
| balance | INTEGER | Default 0 |
| updated_at | TIMESTAMP | Default now() |

---

## Color Palette (Dark Mode Only)

| Token | Hex | Usage |
|---|---|---|
| Background | `#0a0a0f` | Page background |
| Sidebar | `#111118` | Sidebar background |
| Card/Surface | `#16161f` | Cards, popovers |
| Border | `#2a2a3a` | Borders, inputs |
| Primary | `#6366f1` | Indigo — buttons, active states, links |
| Success | `#22c55e` | Passed tests |
| Destructive | `#ef4444` | Failed tests, errors |
| Muted Text | `#888899` | Secondary text, labels |
| Foreground | `#f0f0f8` | Primary text |
| Secondary | `#1e1e2a` | Secondary backgrounds |

---

## Key Pages

### Dashboard (`/dashboard`)
- Stats grid: Tests Run, Issues Found, Avg. Time
- Recent test runs as cards with status badges
- "New Test" CTA button
- Currently uses mock data

### New Test (`/test/new`)
- Centered URL input with globe icon
- "Run Test" button (disabled without URL, non-functional)
- Expandable Advanced Options:
  - Fast Mode toggle (1 run, half credits)
  - Mobile Viewport toggle
- Client component managing local state

### History (`/history`)
- Empty state with icon and message
- Will display searchable test run history

### Sign In / Sign Up
- Clerk components, centered, dark themed

---

## Auth Flow
1. All routes protected by Clerk middleware (src/middleware.ts)
2. Public routes: `/sign-in`, `/sign-up`, `/api/webhooks/*`
3. Unauthenticated users redirected to `/sign-in`
4. Root `/` redirects to `/dashboard`
5. OAuth providers: GitHub + Google

---

## Stripe Integration (Skeleton)
- `src/lib/stripe.ts` — lazy-initialized client (won't crash without key)
- `src/app/api/webhooks/stripe/route.ts` — signature verification + event switch (TODOs)
- Events stubbed: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

## Environment Variables

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Neon Database
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm db:push` | Push schema to Neon |
| `pnpm db:generate` | Generate migrations |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Drizzle Studio |

---

## Commits

1. `afb6e0b` — Initial QAi app shell — Phase 1 complete
2. `63ada97` — Fix Stripe client crashing build when key not set
3. `03df1c6` — Load .env.local in drizzle config for local db commands

---

## What's NOT Built Yet (Phase 2+)

- No actual test execution — "Run Test" button is non-functional
- Dashboard uses mock data, not real database queries
- No Railway worker / Playwright / Docker
- No Cloudflare R2 screenshot storage
- No real-time SSE updates
- No credit deduction logic
- No Stripe payment flows (just skeleton)
- Settings page doesn't exist
- History page shows empty state only
