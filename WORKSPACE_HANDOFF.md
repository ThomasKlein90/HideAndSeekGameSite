# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-10-07
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Verified `origin/main`: `6d87cee` (merged PR #27, Hong Kong Tramways); local `main` was fast-forwarded to this commit.
- Current feature branch: `feature/mtr-light-rail-source-review`, based on `6d87cee`; implementation commit `05506b5` is pushed to `origin/feature/mtr-light-rail-source-review` (no PR created).
- Product stage: MTR routes and Hong Kong Tramways routes/stops are integrated as ODbL OpenStreetMap reference layers. The user accepted MTR overview geometry for gameplay use.

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
- Hong Kong Tramways PR #27: **Merged** into `main` at `6d87cee`.
- MTR Light Rail: source selected and map layer implemented on `feature/mtr-light-rail-source-review`; pending review.
- MTR source review: DATA.GOV.HK lists the MTR Lines (except Light Rail) & Stations CSV, published by MTR Corporation Limited and last updated 2023-06-25. It provides line/direction/station sequence but no coordinates. Its terms require attribution to the Government, relevant organisation, and DATA.GOV.HK. OSM was selected for coordinate-bearing route and station data; its ODbL attribution is displayed.
- MTR OSM geometry slice: Merged PR #24 (`530de3e`, based on merged PR #23). The snapshot at `public/data/mtr-osm.geojson` was extracted from OpenStreetMap at `2026-09-28T06:51:02Z`; supplemental station points were queried at `2026-09-28T07:04:06Z`. ODbL 1.0 attribution and snapshot metadata are displayed in the map. Comparison results from the separately licensed MTR CSV are stored in `public/data/mtr-station-validation.json`, not bundled into the OSM GeoJSON. `npm run lint` and `npm run build` passed; the browser check confirmed 10 lines, 98 station points, source disclosures, independent layer toggles, and mobile-width layout.
- Validation review (2026-10-05): The user visually reviewed the app's MTR route information against the MTR System Map and confirmed that it looks correct for the intended game. The schematic map and station CSV do not provide survey-grade coordinates; no claim of such precision is made. The served station-sequence CSV reports 2023-06-25; the OSM route relations omit AWE, TIK (KTL/TKL), and ETS, while supplemental points exist. OSM tags Sung Wong Toi `SWT`, normalized to MTR `SUW` for comparison only; EAL `RAC` is Racecourse. These are documented as route-relation/source-list differences.
- Updated station comparison data uses `missingFromRouteStops` to distinguish route-relation membership from supplemental station locations. 14 of 54 OSM route relations exactly match a complete listed direction; other relations may be partial or variants.
- Validation implementation: `npm run test:map:mtr` confirms that `SWT` compares as official code `SUW`, does not trigger a false mismatch, and remains unchanged in the OSM feature properties. Browser inspection confirmed the updated comparison disclosure and OSM layer renders 10 lines and 98 stations; at 390px viewport width, the map remains within the 375px layout viewport without horizontal overflow. `npm run lint` and `npm run build` passed.
- A refresh utility is available as `npm run map:mtr:refresh`. It downloads route geometry and the MTR comparison CSV, then queries OSM station nodes missing from route-stop relations. For saved responses, run `node scripts/refresh-mtr-osm-data.mjs <overpass-json> <mtr-station-csv> <supplemental-stations-json>`.
- MTR Light Rail source review and implementation (2026-10-07): selected OpenStreetMap as the coordinate-bearing source. The [DATA.GOV.HK `MTR Lines (except Light Rail) & Stations` resource](https://data.gov.hk/en-data/dataset/mtr-data-routes-fares-barrier-free-facilities/resource/8daba4fe-b879-4a51-8962-27b4cffdc61c) explicitly excludes Light Rail; the existing MTR CSV contains station sequence rather than coordinates. A bounded Overpass query for `relation[route=light_rail][ref][network~"Light Rail"]` in the Tuen Mun/Yuen Long area returned 23 MTR Light Rail route relations covering 12 refs (505, 507, 610, 614, 614P, 615, 615P, 705, 706, 751, 751P, 761P), 450 distinct member ways, and 144 related stop/platform nodes. The source query snapshot was `2026-10-07T06:11:51Z`; the committed layer snapshot was refreshed at `2026-10-07T06:17:50Z`. OSM data is available under ODbL 1.0; retain its [visible attribution and license disclosure](https://www.openstreetmap.org/copyright). The derived service geometry is a reference layer, not an MTR-certified route/timetable feed.

## Current Development Slice

MTR routes and the Hong Kong Tramways OSM route/stop layer are integrated in `main` through PRs #24 and #27. The tram snapshot contains six named service patterns, 12 directional relations, and 118 unique stop nodes. The static ODbL snapshot is `public/data/hong-kong-tramways.geojson`; regenerate it with `npm run map:tram:refresh` (or supply a saved Overpass JSON path to `node scripts/refresh-hk-tramways-data.mjs <overpass-json>`). Route and stop layers have independent controls and stop-name tooltips; OSM attribution, ODbL license, extraction timestamp, and reference-layer caveat are visible.

Light Rail source selection and implementation are complete on `feature/mtr-light-rail-source-review`, based on merged PR #27 (`6d87cee`). `public/data/mtr-light-rail.geojson` contains 12 route-ref features aggregated from 23 OSM service relations and 144 stop/platform nodes. It is generated by `npm run map:light-rail:refresh`; pass a saved Overpass response path to `node scripts/refresh-mtr-light-rail-data.mjs <overpass-json>` for offline regeneration. Direct Node fetching failed in this environment because of its self-signed TLS chain; the snapshot was fetched through PowerShell with TLS verification intact and generated in saved-response mode. Route and stop layers are independently toggleable, route/stop tooltips are available, and OSM/ODbL attribution plus the reference-layer caveat are visible. The mobile browser check confirmed both toggles independently switch off/on, 12 route refs and 144 stop locations load, and a 375px page layout has no horizontal overflow. `npm run test:map:light-rail`, `npm run test:map:mtr`, `npm run test:map:tram`, `npm run lint`, `npm run build`, and `git diff --check` passed. The installed Next.js Server and Client Components guidance was reviewed before app edits. The user creates and merges PRs in their browser; push feature branches after validation, but do not create PRs.

## Start-Of-Session Procedure

1. Open the repository at the workspace root.
2. Read this file, [PROJECT_PLAN.md](PROJECT_PLAN.md), and the repository instructions.
3. Confirm working tree is clean on `main` branch.
4. Fetch and fast-forward `main` to the latest `origin/main`.
5. If the current Light Rail source-review branch is unmerged, continue it rather than duplicating it; otherwise fast-forward a clean local `main` and start from the next planned Phase 2 slice.

### Copy-ready restart prompt

```
Resume from WORKSPACE_HANDOFF.md. Verify `origin/main` contains merged PR #27 or later (baseline `6d87cee`), then continue `feature/mtr-light-rail-source-review` if it remains unmerged. The Light Rail layer now uses versioned OSM/ODbL route and stop/platform data: 12 route references, 144 locations, snapshot `2026-10-07T06:17:50Z`. Separate route/stop overlays, stop tooltips, source attribution, and phone-width checks are implemented. Review the branch, verify `npm run test:map:light-rail`, `npm run lint`, and `npm run build` if needed, then wait for the user to create/merge the PR. Once merged, fast-forward `main` and select the next Phase 2 slice: research an appropriate coordinate-bearing ferry route/terminal source. The user creates and merges PRs separately; do not create one.
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
