# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-10-07
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Verified `origin/main`: `e932323` (merged PR #28, MTR Light Rail); `feature/hong-kong-ferry-routes` is based on this merged baseline.
- Current feature branch: `feature/hong-kong-ferry-routes`, based on `e932323`; implementation commit `1136637` is pushed to `origin/feature/hong-kong-ferry-routes`. No PR was created.
- Product stage: MTR, Tramways, and Light Rail layers are integrated; the ferry layer is implemented on its feature branch as an incomplete-coverage OSM reference layer. The user accepted MTR overview geometry for gameplay use.

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
- MTR Light Rail: source selected and map layer merged through PR #28 at `e932323`.
- MTR source review: DATA.GOV.HK lists the MTR Lines (except Light Rail) & Stations CSV, published by MTR Corporation Limited and last updated 2023-06-25. It provides line/direction/station sequence but no coordinates. Its terms require attribution to the Government, relevant organisation, and DATA.GOV.HK. OSM was selected for coordinate-bearing route and station data; its ODbL attribution is displayed.
- MTR OSM geometry slice: Merged PR #24 (`530de3e`, based on merged PR #23). The snapshot at `public/data/mtr-osm.geojson` was extracted from OpenStreetMap at `2026-09-28T06:51:02Z`; supplemental station points were queried at `2026-09-28T07:04:06Z`. ODbL 1.0 attribution and snapshot metadata are displayed in the map. Comparison results from the separately licensed MTR CSV are stored in `public/data/mtr-station-validation.json`, not bundled into the OSM GeoJSON. `npm run lint` and `npm run build` passed; the browser check confirmed 10 lines, 98 station points, source disclosures, independent layer toggles, and mobile-width layout.
- Validation review (2026-10-05): The user visually reviewed the app's MTR route information against the MTR System Map and confirmed that it looks correct for the intended game. The schematic map and station CSV do not provide survey-grade coordinates; no claim of such precision is made. The served station-sequence CSV reports 2023-06-25; the OSM route relations omit AWE, TIK (KTL/TKL), and ETS, while supplemental points exist. OSM tags Sung Wong Toi `SWT`, normalized to MTR `SUW` for comparison only; EAL `RAC` is Racecourse. These are documented as route-relation/source-list differences.
- Updated station comparison data uses `missingFromRouteStops` to distinguish route-relation membership from supplemental station locations. 14 of 54 OSM route relations exactly match a complete listed direction; other relations may be partial or variants.
- Validation implementation: `npm run test:map:mtr` confirms that `SWT` compares as official code `SUW`, does not trigger a false mismatch, and remains unchanged in the OSM feature properties. Browser inspection confirmed the updated comparison disclosure and OSM layer renders 10 lines and 98 stations; at 390px viewport width, the map remains within the 375px layout viewport without horizontal overflow. `npm run lint` and `npm run build` passed.
- A refresh utility is available as `npm run map:mtr:refresh`. It downloads route geometry and the MTR comparison CSV, then queries OSM station nodes missing from route-stop relations. For saved responses, run `node scripts/refresh-mtr-osm-data.mjs <overpass-json> <mtr-station-csv> <supplemental-stations-json>`.
- MTR Light Rail source review and implementation (2026-10-07): selected OpenStreetMap as the coordinate-bearing source. The [DATA.GOV.HK `MTR Lines (except Light Rail) & Stations` resource](https://data.gov.hk/en-data/dataset/mtr-data-routes-fares-barrier-free-facilities/resource/8daba4fe-b879-4a51-8962-27b4cffdc61c) explicitly excludes Light Rail; the existing MTR CSV contains station sequence rather than coordinates. A bounded Overpass query for `relation[route=light_rail][ref][network~"Light Rail"]` in the Tuen Mun/Yuen Long area returned 23 MTR Light Rail route relations covering 12 refs (505, 507, 610, 614, 614P, 615, 615P, 705, 706, 751, 751P, 761P), 450 distinct member ways, and 144 related stop/platform nodes. The source query snapshot was `2026-10-07T06:11:51Z`; the committed layer snapshot was refreshed at `2026-10-07T06:17:50Z`. OSM data is available under ODbL 1.0; retain its [visible attribution and license disclosure](https://www.openstreetmap.org/copyright). The derived service geometry is a reference layer, not an MTR-certified route/timetable feed.
- Hong Kong ferry slice (2026-10-07): selected OSM `route=ferry` relations and `amenity=ferry_terminal` elements as the coordinate source; official Transport Department pages provide service/operator context but no coordinate-bearing route geometry. The map now has independently toggleable local route groups and terminal points, with visible ODbL attribution and a coverage caveat. The reference snapshot at `public/data/hong-kong-ferries.geojson` contains 14 local route groups and 39 terminal points, extracted `2026-10-07T07:21:24Z`; terminal OSM IDs are represented as `node/<id>`. Cross-border services are filtered. The [Transport Department ferry listings](https://www.td.gov.hk/en/transport_in_hong_kong/public_transport/ferries/index.html) report 21 regular licensed passenger services and two franchised Star Ferry routes as of 31 December 2024; the OSM snapshot is not a complete service list or schedule and contains no Star Ferry route geometry. The terminal-area generator now accepts node, way, and relation centers and has focused way/relation tests, but the current snapshot remains point-based. Overpass refresh attempts during this session timed out, so refresh and confirm major pier-area features when the endpoint is available. OSM data is under [ODbL 1.0](https://www.openstreetmap.org/copyright).
- Ferry validation: all four transit data test files pass together; `npm run lint`, `npm run build`, and `git diff --check` pass. A browser check at a 390px viewport (375px content width) confirmed a 375px document width, all eight map overlays render, and ferry routes and terminals can be independently disabled and restored. The longer ferry status label exposed a mobile map-header overflow; allowing the heading and status pill to wrap fixed it.

## Current Development Slice

MTR routes, Hong Kong Tramways, and MTR Light Rail are integrated into `main` through PR #28 (`e932323`). Tram and Light Rail source details and validation history are recorded above.

The active branch is `feature/hong-kong-ferry-routes`, with implementation commit `1136637` pushed to origin and no PR created. The ferry generator is `npm run map:ferry:refresh` (or run `node scripts/refresh-hk-ferry-data.mjs <overpass-json>` to use a saved Overpass response). The current snapshot's extraction timestamp is `2026-10-07T07:21:24Z`, with 14 route groups and 39 terminal points. Route and terminal layers have independent controls; the data note links OSM attribution and Transport Department ferry context, explicitly warns that coverage is incomplete, and discloses missing Star Ferry route geometry. The source refresh failed due to Overpass dispatcher timeouts, so do not describe the point-based snapshot as updated with area features. Tests, lint, build, mobile-width validation, and diff checks passed. The user creates and merges PRs separately; do not create a PR.

## Start-Of-Session Procedure

1. Open the repository at the workspace root.
2. Read this file, [PROJECT_PLAN.md](PROJECT_PLAN.md), and the repository instructions.
3. Confirm `feature/hong-kong-ferry-routes` is active and review its changes.
4. If resuming before the ferry PR is merged, continue the same branch; once merged, fast-forward `main` and choose the next planned Phase 2 slice.

### Copy-ready restart prompt

```
Resume from WORKSPACE_HANDOFF.md. The ferry implementation is on `feature/hong-kong-ferry-routes`, based on merged PR #28 (`e932323`), and pushed at commit `1136637`; the user handles PR creation and merge. The OSM/ODbL map layer currently contains 14 local route groups and 39 terminal points, snapshot timestamp `2026-10-07T07:21:24Z`; its UI discloses incomplete coverage and missing Star Ferry route geometry. The generator and tests accept terminal-area centers, but the snapshot was not refreshed with those area features because Overpass timed out. The four transit test files, lint, build, diff check, and phone-width map/toggle checks passed. Wait for the user to create and merge the PR; after merge, fast-forward `main`, then refresh/validate ferry pier-area coverage when Overpass is available before selecting the next Phase 2 slice.
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
