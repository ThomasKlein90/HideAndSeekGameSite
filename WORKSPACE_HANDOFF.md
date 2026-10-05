# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-10-05
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Verified `origin/main`: `0e0388b` (merged PR #26); local `main` was fast-forwarded to the same baseline before starting this slice.
- Current feature branch: `feature/hong-kong-tramways`, based on `0e0388b`; implementation commit `74db58b` is pushed to `origin/feature/hong-kong-tramways` (no PR created).
- Product stage: MTR route topology has been visually accepted by the user at overview scale for gameplay use. Hong Kong Tramways routes/stops are integrated from an ODbL OSM snapshot as a reference layer.

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
- MTR PR #22, provenance PR #23, OSM geometry PR #24, handoff update PR #25, and route-validation PR #26: **Merged** into `main`; feature baseline for this slice is `0e0388b`.
- MTR source review: DATA.GOV.HK lists the MTR Lines (except Light Rail) & Stations CSV, published by MTR Corporation Limited and last updated 2023-06-25. It provides line/direction/station sequence but no coordinates. Its terms require attribution to the Government, relevant organisation, and DATA.GOV.HK. OSM was selected for coordinate-bearing route and station data; its ODbL attribution is displayed.
- MTR OSM geometry slice: Merged PR #24 (`530de3e`, based on merged PR #23). The snapshot at `public/data/mtr-osm.geojson` was extracted from OpenStreetMap at `2026-09-28T06:51:02Z`; supplemental station points were queried at `2026-09-28T07:04:06Z`. ODbL 1.0 attribution and snapshot metadata are displayed in the map. Comparison results from the separately licensed MTR CSV are stored in `public/data/mtr-station-validation.json`, not bundled into the OSM GeoJSON. `npm run lint` and `npm run build` passed; the browser check confirmed 10 lines, 98 station points, source disclosures, independent layer toggles, and mobile-width layout.
- Validation review (2026-10-05): The user visually reviewed the app's MTR route information against the MTR System Map and confirmed that it looks correct for the intended game. The schematic map and station CSV do not provide survey-grade coordinates; no claim of such precision is made. The served station-sequence CSV reports 2023-06-25; the OSM route relations omit AWE, TIK (KTL/TKL), and ETS, while supplemental points exist. OSM tags Sung Wong Toi `SWT`, normalized to MTR `SUW` for comparison only; EAL `RAC` is Racecourse. These are documented as route-relation/source-list differences.
- Updated station comparison data uses `missingFromRouteStops` to distinguish route-relation membership from supplemental station locations. 14 of 54 OSM route relations exactly match a complete listed direction; other relations may be partial or variants.
- Validation implementation: `npm run test:map:mtr` confirms that `SWT` compares as official code `SUW`, does not trigger a false mismatch, and remains unchanged in the OSM feature properties. Browser inspection confirmed the updated comparison disclosure and OSM layer renders 10 lines and 98 stations; at 390px viewport width, the map remains within the 375px layout viewport without horizontal overflow. `npm run lint` and `npm run build` passed.
- A refresh utility is available as `npm run map:mtr:refresh`. It downloads route geometry and the MTR comparison CSV, then queries OSM station nodes missing from route-stop relations. For saved responses, run `node scripts/refresh-mtr-osm-data.mjs <overpass-json> <mtr-station-csv> <supplemental-stations-json>`.

## Current Development Slice

MTR route geometry, the code-alias comparison, and the clarified discrepancy display are integrated in `main` via PR #26. Hong Kong Tramways are now added from OSM: six named service patterns, 12 directional relations, and 118 unique stop nodes. The static ODbL snapshot is `public/data/hong-kong-tramways.geojson`; regenerate it with `npm run map:tram:refresh` (or supply a saved Overpass JSON path to `node scripts/refresh-hk-tramways-data.mjs <overpass-json>`). Route and stop layers have independent controls and stop-name tooltips; OSM attribution, ODbL license, extraction timestamp, and reference-layer caveat are visible. OSM includes two stop nodes without names; these are rendered with a generic stop tooltip rather than silently dropping their geometries.

The map preview loads 10 MTR lines, 98 MTR stations, six tram service patterns, and 118 tram stops. Route/stop toggles were tested independently; the combined map was visually reviewed at 390px viewport width with no horizontal page overflow. `npm run test:map:tram`, `npm run lint`, `npm run build`, and `git diff --check` passed. Keep OSM attribution and ODbL terms visible for both transit datasets. The user creates and merges PRs in their browser; push feature branches after validation, but do not create PRs.

## Start-Of-Session Procedure

1. Open the repository at the workspace root.
2. Read this file, [PROJECT_PLAN.md](PROJECT_PLAN.md), and the repository instructions.
3. Confirm working tree is clean on `main` branch.
4. Fetch and fast-forward `main` to the latest `origin/main`.
5. If the Hong Kong Tramways PR has not been merged, continue its pushed branch rather than duplicating it; otherwise create a focused feature branch from latest merged `main`.

### Copy-ready restart prompt

```
Resume from WORKSPACE_HANDOFF.md. Verify the Hong Kong Tramways feature branch has been merged into origin/main; if not, continue its pushed branch rather than duplicating it. Once merged, fast-forward a clean local main and create a focused branch for the next Phase 2 slice: research and select a suitably licensed coordinate-bearing source for MTR Light Rail routes and stops before implementing that layer. Preserve visible OSM attribution/ODbL licensing wherever OSM data is used, check the relevant installed Next.js guidance before application-code edits, update the plan/handoff with source decisions, run focused checks plus `npm run lint` and `npm run build` for application changes, then commit conventionally and push. The user creates and merges PRs separately; do not create one.
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
