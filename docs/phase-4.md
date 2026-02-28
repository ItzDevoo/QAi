# QAi — Phase 4: Report UI Polish, Screenshots, False Positives

> Completed February 28, 2026
> Live at: https://qai.itzdevoo.com
> Worker at: https://qai-worker-production.up.railway.app

---

## What Was Built

Phase 4 makes test reports **professional, visual, and trustworthy**. Users can now see what the AI saw (screenshots), dismiss false positives, and understand what was actually tested (coverage summary). The AI prompt was also tuned to stay on-domain and reduce false positives.

---

## Features

### 1. Screenshot Timeline
- Worker captures screenshots at key steps: step 1, every 5th step, assert_error steps, and the last step
- Screenshots are sent in a batch with the final callback (not per-step, to avoid large payloads)
- Report page shows a horizontal scrollable timeline of thumbnail screenshots
- Click any thumbnail to open a fullscreen dialog with prev/next navigation
- Assert_error steps are highlighted with a red border

### 2. False Positive Dismissal
- Each AI-detected issue has a "Not a bug" button (ThumbsDown icon)
- Clicking it calls `POST /api/issues/[id]/dismiss`
- Backend sets `issues.dismissed = true` and decrements `testRuns.issueCount`
- Client-side: dismissed issues are hidden immediately via React state
- Only shown on `ai_detected` category issues (deterministic checks don't have false positives)

### 3. Coverage Summary
- Shows what the AI actually tested: pages visited, clicks, form inputs, scrolls, issues flagged
- Extracts unique URLs from step descriptions (navigate/analyze actions)
- Counts actions by type from the step data
- Prevents false confidence — "0 issues" means more when you can see 5 pages were tested with 12 clicks

### 4. Prompt Tuning
- System prompt now embeds the origin domain explicitly: `NEVER navigate away from ${origin}`
- Added rules against testing authentication flows (login, signup, OAuth)
- Added guidance to verify issues before reporting (reduce false positives)
- Added examples of correct vs incorrect issue reporting (e.g., auth redirects are expected behavior)

---

## Architecture

```
Worker AI Loop (20 steps)
  ↓
Collects pendingScreenshots Map<step, {base64, description}>
  ↓
After loop: filters to key screenshots (step 1, every 5th, assert_errors, last)
  ↓
Returns AiLoopResult { issues, screenshots }
  ↓
Final callback sends screenshots[] array
  ↓
Webhook handler matches screenshots to ai_steps rows by runNumber + stepNumber
  ↓
Frontend fetches steps with ?screenshots=true query param
  ↓
ScreenshotTimeline renders thumbnails + dialog viewer
```

---

## Files Changed

### Worker (`qai-worker`)
| File | Change |
|------|--------|
| `src/ai/types.ts` | Added `StepScreenshot`, `AiLoopResult` types |
| `src/ai/runner.ts` | Collect key screenshots, return `AiLoopResult` |
| `src/ai/prompts.ts` | `buildSystemPrompt(originUrl)` with domain enforcement |
| `src/index.ts` | Pass screenshots in final callback, pass origin URL to AI loop |

### Next.js App (`qai`)
| File | Change |
|------|--------|
| `src/db/schema.ts` | Added `dismissed` boolean to issues table |
| `src/app/api/issues/[id]/dismiss/route.ts` | New dismiss endpoint |
| `src/app/api/webhooks/worker/route.ts` | Store screenshots in ai_steps |
| `src/app/api/test-runs/[id]/steps/route.ts` | `?screenshots=true` query param |
| `src/components/screenshot-timeline.tsx` | New screenshot viewer component |
| `src/components/coverage-summary.tsx` | New coverage summary component |
| `src/app/(app)/test/[id]/page.tsx` | DismissButton, ScreenshotTimeline, CoverageSummary integration |

---

## Database Changes
- `issues.dismissed` — boolean, default false
- `ai_steps.screenshot_base64` — already existed, now populated via final callback

---

## What's Next — Phase 5
Stripe payments, billing, free tier limits, and usage tracking.
