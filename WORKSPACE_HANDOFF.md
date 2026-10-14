# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-10-14
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Verified PR #35 (manual station check-ins) merged and closed on 2026-10-14. Local `main` matches `origin/main` at `9308528`.
- Current branch: `feature/check-in-corrections`, based on merged PR #35 (`9308528`).
- Product stage: MTR, Tramways, Light Rail, ferries, district boundaries, island labels, map search, playable/no-go district selection, seeker status, and manual station check-ins are integrated in `main`.

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
  - Migrations `20261012170000_game_playable_districts.sql` and `20261014140000_game_station_checkins.sql` were manually applied through the Supabase Dashboard. Read-only catalog checks confirmed the district-aware `create_game` signature and `game_settings.playable_districts`, plus the check-in table, RPC, RLS, and expected select policy.
  - The Dashboard project matches the local app's Supabase project. `supabase_migrations.schema_migrations` is absent, so Dashboard-applied migrations are not reconciled with CLI history. Do not run `supabase db push` until history is safely reconciled.
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
- Hong Kong district boundaries (2026-10-07): extracted the 18 named district relations (OSM `boundary=administrative`, `admin_level=6`) with Overpass. The geometry snapshot is timestamped `2026-10-07T09:17:22Z`; a separate center query used for labels was timestamped `2026-10-07T09:16:18Z`. The data excludes nearby Shenzhen districts and Lok Ma Chau Loop by requiring one of the 18 English district names. The generator stitches relation member ways into valid outer/inner MultiPolygon rings, preserves Sha Tin/Tai Po inner rings, checks all districts are present, and records ODbL attribution and source metadata. Map layer shows subtle district outlines with hover names and zoom-dependent English labels from zoom 14. This is an OSM reference layer, not an official government GIS dataset or playable game boundary.
- District validation: focused district tests and all four transit tests pass; lint, production build, and `git diff --check` pass. Browser check at 390px viewport (375px content width) confirms all 18 outlines render, 18 labels appear after zooming to 14+, the layer toggles off/on, and there is no horizontal overflow. Labels are hidden at city overview scale after initial validation showed overlap; hover names remain available.
- Hong Kong island labels (2026-10-12): the curated OSM snapshot at `public/data/hong-kong-islands.geojson` contains 24 named islands with ODbL-1.0 attribution and extraction metadata (`2026-10-12T08:39:49Z`). The generator and focused test are `npm run map:islands:refresh` and `npm run test:map:islands`; labels are independently toggleable and start at zoom 13. All six map-data test commands, lint, production build, and `git diff --check` pass. Browser review at 390px confirms the 375px document does not overflow, all 24 label tooltips mount at the close-zoom threshold, the layer can be independently disabled/restored (0/24 labels), and visible OSM/ODbL attribution and the 24-island status count are present.
- Local map search (2026-10-12): indexes the loaded OSM/MTR station and stop data, ferry terminals, districts, and curated islands; matches English/Chinese names and available station/stop codes, shows up to eight categorized results, and recenters/highlights the selection. It is snapshot-only and does not contact an external geocoder or support arbitrary addresses. All six map-data test commands, lint, production build, and diff check pass. Browser checks confirmed exact/partial and Chinese-name matches, no-match and clear behavior, map recentering/target highlight, and no horizontal overflow at 390px or 320px viewport widths.
- District boundary configuration (2026-10-12, PR #33): game setup presents all 18 Hong Kong districts checked by default; checked districts are playable and unchecked districts are no-go. The selected names are passed to `create_game`, validated in SQL and persisted in `game_settings.playable_districts`; existing games default to all districts. Active-game setup reads and summarizes the saved selection for participants. TypeScript/GeoJSON/SQL district-list consistency check, all six map-data tests, lint, build, and diff check passed. Migration application and the district-aware create-game signature were later confirmed in Supabase by Dashboard catalog query; the two-account game-creation smoke test passed.
- Seeker-status panel (2026-10-14): a seeker-only status snapshot of team assignment and the assigned seeker roster, backed by existing `game_players` membership data. Includes manual refresh and makes clear that check-ins and location sharing are not collected. No schema or tracking changes.
- Seeker-status panel validation: `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check` passed. No authenticated/live UI smoke test was run because this environment has no authenticated Supabase session; the remote district-migration check also remains blocked as described above.
- Manual station check-ins (2026-10-14, PR #35): assigned Seekers report an MTR station; each latest report is visible to Hiders and the submitting Seeker. Optional Hider Team station reports are visible to Hiders and the game host; the newest Hider report sets the configured hiding-radius center. Reports become stale at 15 minutes but remain visible. Proximity advisories require both the Hider radius-center report and Seeker report to be fresh, and the host retains phase-transition control. No GPS or automatic location collection. A completed game disables new submissions.
- Check-in validation: `npm.cmd run test:game:check-ins` passes the focused freshness, stale-anchor suppression, meter-distance, and 98-station snapshot tests; `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check` pass. Manual deployment and the two-account authenticated smoke-test results are recorded below.
- Manual check-in deployment and smoke test (2026-10-14, PR #35): the district-selection prerequisite and check-in migration were applied manually in the Supabase Dashboard. Catalog checks confirmed the district-aware game-creation function and setting, and the check-in table, RPC, RLS, and expected policy. Using two disposable test accounts on the matching local app, game creation and team assignment succeeded; a fresh Seeker report appeared to Hiders; the Hider station remained hidden from a non-host Seeker; Central-to-Central produced the expected within-radius advisory; changing the Seeker report to Tuen Mun showed outside-radius and removed the alert. The phase did not change. Live 15-minute stale transition and full four-account/mobile test remain unverified.
- Check-in correction slice (2026-10-14): implementation is on `feature/check-in-corrections`. The host can inspect and correct all player reports, including Hider reports when assigned to Seekers; non-host visibility remains team-scoped. Only the host can read correction history. Corrections can change station and reported time, preserve previous/corrected values with actor and correction time, and are blocked once a game is complete. New migration `20261014160000_game_checkin_corrections.sql` is local and has not been applied remotely.
- Correction validation: `npm.cmd run test:game:check-ins` passes four tests, including datetime-local round-tripping; `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check` pass. Live correction and host-only history access await application of the new migration; do not run `supabase db push` because manually deployed migration history is not reconciled.

## Current Development Slice

MTR routes, Hong Kong Tramways, MTR Light Rail, ferries, district boundaries, island labels, map search, and playable/no-go district selection are integrated into `main` through PR #33 (`89982eb`). Source details and validation history are recorded above.

PR #34 added the dedicated seeker-status panel (seeker assignment and roster only, no check-ins or location sharing) and is merged and closed.

PR #35 added manual station check-ins and is merged and closed. Local `main` was fast-forwarded to `9308528`, matching `origin/main`.

Migrations `20261012170000_game_playable_districts.sql` and `20261014140000_game_station_checkins.sql` were applied manually through the Supabase Dashboard and verified with read-only catalog checks. The correction migration `20261014160000_game_checkin_corrections.sql` is pending. `supabase_migrations.schema_migrations` is absent, so CLI migration history is not reconciled; do not run `supabase db push` until safely resolved.

The two-account check-in smoke test passed creation/assignment, Seeker report visibility, Hider-location privacy from non-host Seekers, inside/outside radius behavior, alert removal, and no automatic phase transition. Live stale-age UI and four-account mobile testing remain.

Current slice: host-only audited check-in corrections. The host can inspect/correct all player reports, including Hider reports while assigned to Seekers; non-host Hider/Seeker visibility remains unchanged. The host may revise station and reported time; each correction records previous/corrected values, correcting host, and correction time. History is host-only and retained for the game record's lifetime. Completed games cannot be corrected. The implementation is locally validated; its migration is not deployed. After merge, apply the migration through the approved Dashboard workflow and smoke-test host correction, history privacy, non-host denial, and completed-game rejection.

After this slice, continue Phase 5 reliability work: finish the four-player mobile smoke test and address reconnects, duplicate actions, and simultaneous updates. Ferry OSM refresh/pier coverage remains a parallel map-maintenance follow-up.

## Start-Of-Session Procedure

1. Open the repository at the workspace root.
2. Read this file, [PROJECT_PLAN.md](PROJECT_PLAN.md), and the repository instructions.
3. Verify `origin/main` and create a focused branch from current `main`.
4. The district-selection and check-in migrations were manually applied through Dashboard and verified via catalog queries. The migration-history table is absent, so reconcile CLI history before any `supabase db push`.
5. The two-account check-in smoke test passed for submission, visibility, privacy, proximity alerts, and host-controlled phases. Live stale-age UI and four-player mobile testing remain. Host-only check-in corrections are implemented on `feature/check-in-corrections`; its migration is pending. After merge, apply it through the approved Dashboard workflow and smoke-test corrections/history. Do not add GPS, live location sharing, or automatic phase changes.

### Copy-ready restart prompt

```
Resume from WORKSPACE_HANDOFF.md. Verify `origin/main` includes merged PR #35 (`9308528`) and continue `feature/check-in-corrections`. The district-selection and check-in migrations were applied manually through Supabase Dashboard; catalog checks passed, but `supabase_migrations.schema_migrations` is absent, so do not run `supabase db push` until migration history is reconciled. The two-account local-app check-in smoke test passed role visibility/privacy, inside/outside radius behavior, and no automatic phase transition. The correction UI and RPC are implemented locally; migration `20261014160000_game_checkin_corrections.sql` is not deployed. Hosts can correct station/time, original and corrected values plus actor/time are retained, correction history is host-only, and completed games reject corrections. Read relevant installed Next.js guidance before app edits, run focused checks plus lint/build, update plan/handoff, commit, and push; the user creates and merges PRs separately. After merge and approved migration deployment, smoke-test correction authorization/history, then continue Phase 5 reliability and four-player mobile testing.
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
