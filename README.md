# trirox

TRIROX iOS Web App

A private, mobile-first training web app built from the supplied v3 project pack.

## Run

Node 22.13 or newer. Run npm install, npm run db:generate (only after schema edits), then apply the checked-in migration with Wrangler using wrangler.local.json. Run npm run dev.

## Implemented

- Today, weekly Plan, single-page Analysis, and six-entry Profile.
- D1-backed profiles, workouts, races, check-ins, logs, injuries, preferences and AI decisions.
- Optimistic revision checking prevents concurrent writes from overwriting one another.
- Workout editing, preview and confirmation; future workouts cannot be reported.
- CNS, normalized ACWR, recovery score and provisional interference rules.
- AI changes require an explicit accept action; injury exclusions take priority.
- Quick-check exclusion flags do not alter the recovery formula.
- HYROX 17-segment and triathlon transition timers (session-only).
- Apple home-screen icon and standalone web manifest.
- Demo data is clearly labeled and can be replaced with personal records after confirmation.

## Product boundaries

This is a functional web MVP, not a native iOS / App Store application.
HealthKit requires a native iOS integration. Garmin and COROS OAuth/API credentials, push delivery, background timers and account management are not implemented here. These boundaries are shown in the UI.
The Site must remain owner-private: the first version intentionally stores one athlete aggregate. Do not share access before adding per-user authentication and data isolation.
The source engineering specification in docs is unmodified. All algorithm constants are provisional. The full scientific model, exercise-specific eccentric weights, personalized periodization, automatic capability recalibration, causal attribution and race prediction need calibrated data and product review. Predictions are withheld rather than fabricated.
ACWR uses (7-day sum / 7) divided by (28-day sum / 28), consistently choosing the rolling-average option in the specification.
The timer is foreground-only and split times are not durable yet.
Browser WebMCP support is feature-detected; its runtime contract has not been verified in a supporting browser.
