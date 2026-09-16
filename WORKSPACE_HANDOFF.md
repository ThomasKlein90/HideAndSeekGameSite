# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-09-16
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Working branch: `feature/hong-kong-mtr-layer`
- Baseline commit: `99bce76` (merged PR #21)
- Product stage: Phase 2 interactive OpenStreetMap base map and initial MTR reference overlay implemented; remaining transit and geographic overlays remain pending source review.

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
  - Final-hiding radius display and host/Hider Team reference point entry with label and coordinates.
- **Database & Security**:
  - All 13 migrations applied to Supabase project `gthvxhakvehnrvvzcglh`.
  - Row Level Security (RLS) enabled across all tables with `PL/pgSQL SECURITY DEFINER` helper functions (`is_game_host`, `is_game_member`, `is_seeker`, `is_hider`).

## Validation Results

- `npm run lint`: **Passed** (clean, zero warnings/errors).
- `npm run build`: **Passed** (Next.js App Router Turbopack production build clean).
- Live multi-user smoke test: **Passed** (verified host game creation, second player join, seeker question submission, hider answer + card reward log, and seeker answer history).
- Final-hiding reference point slice: **Passed** lint/build; remote migration `20260916100000_final_hiding_reference_point.sql` was applied through the Supabase Dashboard.
- Hong Kong interactive map slice: **Implemented** with Leaflet, OpenStreetMap tiles and attribution, Hong Kong center/radius preview, responsive styling, and a pending-layer legend. `npm run lint`, `npm run build`, and `git diff --check` passed.
- MTR map slice: **Implemented** with a simplified, clearly labeled reference overlay, line colors, station markers/tooltips, independent layer toggles, and legend entries. The geometry is planning-only until a source is selected and visually validated.

## Next Development Slice

Pending review and merge:
1. **Phase 2 - MTR source validation and remaining overlays**:
   - Select an appropriately licensed MTR dataset, replace or verify the planning geometry, then add Tram, Ferry, district, and search layers.
2. **Phase 4 - Dedicated Seeker Status Panel**:
   - Prepare a role-restricted panel for future manual check-ins and consented locations.

## Start-Of-Session Procedure

1. Open the repository at the workspace root.
2. Read this file, [PROJECT_PLAN.md](PROJECT_PLAN.md), and the repository instructions.
3. Confirm working tree is clean on `main` branch.
4. Pull latest `origin/main`.
5. Confirm the final-hiding migration remains applied in the Supabase Dashboard.
6. Create a new focused feature branch from the latest merged `main`.

### Copy-ready restart prompt

```
Resume from WORKSPACE_HANDOFF.md. Confirm origin/main contains merged PR #21 or later and update a clean main branch, then continue the Phase 2 map work by validating the MTR reference geometry and selecting an appropriately licensed source before adding further transit or geographic layers. Check the relevant Next.js guidance before any application-code edits. Follow the standard development loop: create a focused feature branch, implement the feature, run npm run lint and npm run build, commit with a conventional commit message, and open a PR.
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
