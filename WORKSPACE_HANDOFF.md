# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-09-14
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Working branch: `chore/smoke-test-verification`
- Baseline commit: `5001f49` (merged PR #18, password authentication)
- Product stage: Core game flow, role-based dashboards, authentication, timer, question engine, and card log fully verified in live smoke test against Supabase project `gthvxhakvehnrvvzcglh`.

## Implemented & Verified in Live Smoke Test

- **Authentication**:
  - Email + Password registration and sign-in.
  - Passwordless Magic Link toggle.
  - Display-name configuration stored in `profiles`.
- **Game Setup & Access Control (Phase 1)**:
  - Host game creation with custom head start, radius, name, and initial team selection.
  - 6-character game join code generation and joining by players.
  - Host team assignment with 2-player team limits.
  - Active game session persistence across page reloads and "Back to Lobby / Switch Game" controls.
- **Round Dashboard, Timer & Audit Log (Phase 1 & Phase 4)**:
  - Server-authoritative phase transitions (`setup` -> `hider_head_start` -> `active_seeking` -> `final_hiding` -> `round_complete` -> `game_complete`) via `transition_game_phase()` RPC.
  - Live countdown timer for hider head start (15:00 default).
  - Append-only audit log tracking phase transitions with timestamps.
- **Seeker Question Board (Phase 3)**:
  - 6 question categories (Matching, Measuring, Thermometer, Radar, Tentacles, Photos).
  - Question template selection, duplicate submission prevention per round.
  - Real-time question dispatch to Hiders.
  - Seeker private annotations (notes, pins, eliminated areas) scoped by RLS.
  - Seeker answered question history view with timestamps and card reward notes.
- **Hider Dashboard (Phase 4)**:
  - Incoming pending question queue with expected answer types (Yes/No, number, text, photo).
  - Answer submission and physical card reward logging (`held`, `used`, `expired`).
  - Hider card hand management.
- **Database & Security**:
  - All 13 migrations applied to Supabase project `gthvxhakvehnrvvzcglh`.
  - Row Level Security (RLS) enabled across all tables with `PL/pgSQL SECURITY DEFINER` helper functions (`is_game_host`, `is_game_member`, `is_seeker`, `is_hider`).

## Validation Results

- `npm run lint`: **Passed** (clean, zero warnings/errors).
- `npm run build`: **Passed** (Next.js App Router Turbopack production build clean).
- Live multi-user smoke test: **Passed** (verified host game creation, second player join, seeker question submission, hider answer + card reward log, and seeker answer history).

## Next Development Slice

Ready to begin from `PROJECT_PLAN.md`:
1. **Phase 4 - Final Hiding Reference Point**:
   - Add reference hiding point selector and final-hiding radius visual indicator on the Hider Dashboard.
2. **Phase 2 - Hong Kong Interactive Base Map**:
   - Select map library (Leaflet / MapLibre) and integrate Hong Kong base map with MTR / Tram / Ferry / District layers.

## Start-Of-Session Procedure

1. Open the repository at the workspace root.
2. Read this file, [PROJECT_PLAN.md](PROJECT_PLAN.md), and the repository instructions.
3. Confirm working tree is clean on `main` branch.
4. Pull latest `origin/main`.
5. Create a new focused feature branch (e.g. `feature/hider-final-hiding-point` or `feature/hong-kong-map`).

### Copy-ready restart prompt

```
Resume from WORKSPACE_HANDOFF.md. Confirm origin/main is at merged PR #18 or later, switch to an updated clean main branch, and begin the next planned slice from PROJECT_PLAN.md (Phase 4 final hiding point or Phase 2 Hong Kong map). Check the relevant Next.js guidance before any application-code edits. Follow the standard development loop: create a focused feature branch, implement the feature, run npm run lint and npm run build, commit with conventional commit message, and open a PR.
```

Before ending a session, leave the worktree either clean on `main` after a
merged pull request or clearly marked on the active feature branch with its
commit and pull-request status.

## Branch And Review Policy

- Keep `main` as the integration branch.
- Create one focused branch from the latest merged `main` for each major change.
- Open a pull request for every branch and use the repository pull-request checklist.
- Run focused checks plus `npm run lint` and `npm run build` before review.
- Review application code, migrations, generated types, and the final diff.
- Merge only after approval and passing checks.
- Start the next major branch from the updated `main` after merge.
