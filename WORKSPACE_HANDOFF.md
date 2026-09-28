# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-09-28
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Working branch: `feature/mtr-osm-geometry`
- Baseline commit: `17099b6` (merged PR #23)
- Product stage: Phase 2 OSM-derived MTR route/station geometry integrated with visible ODbL attribution; route-stop/station-code discrepancies remain for follow-up validation.

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
- Hong Kong interactive map slice: **Implemented** with Leaflet, OpenStreetMap tiles and attribution, Hong Kong center/radius preview, responsive styling, and independent layer controls. `npm run lint`, `npm run build`, and `git diff --check` passed.
- MTR map slice: **Implemented** with OpenStreetMap-derived geometry for 10 MTR lines and 98 station points, independent route/station layer toggles, station tooltips, and visible OpenStreetMap contributor/ODbL attribution.
- MTR PR #22 and provenance PR #23: **Merged** into `main`; latest confirmed `origin/main` is `17099b6`.
- MTR source review: DATA.GOV.HK lists the MTR Lines (except Light Rail) & Stations CSV, published by MTR Corporation Limited and last updated 2023-06-25. It provides line/direction/station sequence but no coordinates. Its terms require attribution to the Government, relevant organisation, and DATA.GOV.HK. OSM was selected for coordinate-bearing route and station data; its ODbL attribution is displayed.
- MTR OSM geometry slice: Branch `feature/mtr-osm-geometry` is based on `17099b6` (merged PR #23). The snapshot at `public/data/mtr-osm.geojson` was extracted from OpenStreetMap at `2026-09-28T06:51:02Z`; supplemental station points were queried at `2026-09-28T07:04:06Z`. ODbL 1.0 attribution and snapshot metadata are displayed in the map. Comparison results from the separately licensed MTR CSV are stored in `public/data/mtr-station-validation.json`, not bundled into the OSM GeoJSON.
- Validation comparison: station-code coverage was compared with the 2023 MTR CSV; 14 of 54 OSM route relations exactly match a complete listed direction. Some relations represent split/variant services. Differences: AEL route-stop relations omit AWE; KTL/TKL omit TIK; TML omits ETS and SUW while OSM has SWT; EAL has OSM-only RAC. Additional OSM point features supply AWE, TIK, and ETS station markers, but route membership/order and the SWT/SUW discrepancy still need review.
- A refresh utility is available as `npm run map:mtr:refresh`. It downloads route geometry and the MTR comparison CSV, then queries OSM station nodes missing from route-stop relations. For saved responses, run `node scripts/refresh-mtr-osm-data.mjs <overpass-json> <mtr-station-csv> <supplemental-stations-json>`.

## Current Development Slice

The current branch implements the OSM-derived MTR geometry snapshot and its generator. The map labels the OSM provenance and ODbL 1.0 license, and discloses comparison differences with the older MTR station CSV. The local browser check confirmed all 10 route features, 98 station points, attribution links, independent toggles, and mobile-width layout. Run lint/build after any follow-up changes.

Next, validate the route shapes and known station-code/route-stop differences visually and against current MTR information. Do not mark the MTR layer authoritative or start more transit/geographic layers until these differences are reviewed. The user will create and merge PRs in their browser; after committing, push the branch but do not create a PR.

## Start-Of-Session Procedure

1. Open the repository at the workspace root.
2. Read this file, [PROJECT_PLAN.md](PROJECT_PLAN.md), and the repository instructions.
3. Confirm working tree is clean on `main` branch.
4. Pull latest `origin/main`.
5. Confirm the final-hiding migration remains applied in the Supabase Dashboard.
6. Create a new focused feature branch from the latest merged `main`.

### Copy-ready restart prompt

```
Resume from WORKSPACE_HANDOFF.md. Confirm origin/main contains merged PR #23 or later (expected baseline 17099b6), update a clean main branch, and create a focused feature branch to continue validating the OSM-derived MTR routes and station locations. Check the installed Next.js guidance before application-code edits. Review known route-stop differences against current MTR information and visually inspect route geometry on mobile. Run npm run lint and npm run build, commit conventionally, and push the branch. The user will create and merge the PR separately; do not create one.
```

Before ending a session, leave the worktree either clean on `main` after a
merged pull request or clearly marked on the active feature branch with its
commit and pushed status. The user creates and merges pull requests separately.

## Branch And Review Policy

- Keep `main` as the integration branch.
- Create one focused branch from the latest merged `main` for each major change.
- Push each focused branch after validation; the user creates and merges pull requests separately in their browser.
- Run focused checks plus `npm run lint` and `npm run build` before review.
- Review application code, migrations, generated types, and the final diff.
- Merge only after approval and passing checks.
- Start the next major branch from the updated `main` after merge.
