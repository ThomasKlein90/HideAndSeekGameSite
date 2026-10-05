# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-10-05
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Verified `origin/main`: `d71c050` (merged PR #25); the clean local `main` was fast-forwarded to this commit.
- Current feature branch: `feature/mtr-route-validation`, created from `d71c050`.
- Product stage: Phase 2 OSM-derived MTR geometry is integrated with visible ODbL attribution; overview topology and several station-code differences have been reviewed, but precise geographic validation remains open and the layer is provisional.

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
- MTR PR #22, provenance PR #23, OSM geometry PR #24, and handoff update PR #25: **Merged** into `main`; latest confirmed `origin/main` is `d71c050`.
- MTR source review: DATA.GOV.HK lists the MTR Lines (except Light Rail) & Stations CSV, published by MTR Corporation Limited and last updated 2023-06-25. It provides line/direction/station sequence but no coordinates. Its terms require attribution to the Government, relevant organisation, and DATA.GOV.HK. OSM was selected for coordinate-bearing route and station data; its ODbL attribution is displayed.
- MTR OSM geometry slice: Merged PR #24 (`530de3e`, based on merged PR #23). The snapshot at `public/data/mtr-osm.geojson` was extracted from OpenStreetMap at `2026-09-28T06:51:02Z`; supplemental station points were queried at `2026-09-28T07:04:06Z`. ODbL 1.0 attribution and snapshot metadata are displayed in the map. Comparison results from the separately licensed MTR CSV are stored in `public/data/mtr-station-validation.json`, not bundled into the OSM GeoJSON. `npm run lint` and `npm run build` passed; the browser check confirmed 10 lines, 98 station points, source disclosures, independent layer toggles, and mobile-width layout.
- Validation review (2026-10-05): The app's route/station overlay was visually inspected at Hong Kong-wide zoom against the MTR System Map. The network topology appears plausible, but the schematic official map cannot validate precise track geometry or station coordinates. The currently served MTR station-sequence CSV still reports its last update as 2023-06-25; it lists AWE, TIK, ETS, and SUW. The OSM route relations omit AWE, TIK (KTL and TKL), and ETS; supplemental OSM station points are present for those codes. OSM tags Sung Wong Toi as `SWT`, while MTR uses `SUW`; the refresh utility now normalizes `SWT` to `SUW` for comparison only and preserves the original OSM tag in the GeoJSON. EAL's OSM-only `RAC` is Racecourse, shown on the current MTR System Map but absent from the station-sequence CSV. These relation-level differences do not imply that station markers are missing. Only overview plausibility is validated; do not treat the layer as authoritative until detailed geographic review is complete.
- Updated station comparison data uses `missingFromRouteStops` to distinguish route-relation membership from supplemental station locations. 14 of 54 OSM route relations exactly match a complete listed direction; other relations may be partial or variants.
- Validation implementation: `npm run test:map:mtr` confirms that `SWT` compares as official code `SUW`, does not trigger a false mismatch, and remains unchanged in the OSM feature properties. Browser inspection confirmed the updated comparison disclosure and OSM layer renders 10 lines and 98 stations; at 390px viewport width, the map remains within the 375px layout viewport without horizontal overflow. `npm run lint` and `npm run build` passed.
- A refresh utility is available as `npm run map:mtr:refresh`. It downloads route geometry and the MTR comparison CSV, then queries OSM station nodes missing from route-stop relations. For saved responses, run `node scripts/refresh-mtr-osm-data.mjs <overpass-json> <mtr-station-csv> <supplemental-stations-json>`.

## Current Development Slice

The OSM-derived MTR geometry snapshot and refresh utility are integrated in `main` via PR #24; handoff updates were merged in PR #25. This feature branch normalizes the verified OSM `SWT` / MTR `SUW` station-code alias for comparison, clarifies route-relation versus station-point discrepancies, and documents the MTR map comparison.

Next, validate precise route geometry and station locations against an appropriately licensed coordinate-bearing source. The current MTR System Map is schematic, and the official station-sequence CSV contains no coordinates. Do not mark the MTR layer authoritative or start more transit/geographic layers until detailed validation is done. Current unresolved route-relation omissions are AWE (AEL), TIK (KTL and TKL), and ETS (TML); the corresponding supplemental points exist. The code alias `SWT`/`SUW` has been reconciled, and EAL `RAC` is the Racecourse variant. The user creates and merges PRs in their browser; push feature branches after validation, but do not create PRs.

## Start-Of-Session Procedure

1. Open the repository at the workspace root.
2. Read this file, [PROJECT_PLAN.md](PROJECT_PLAN.md), and the repository instructions.
3. Confirm working tree is clean on `main` branch.
4. Fetch and fast-forward `main` to the latest `origin/main`.
5. If the current MTR validation PR has not been merged, resume its branch rather than duplicate it; otherwise create a focused feature branch from the latest merged `main`.

### Copy-ready restart prompt

```
Resume from WORKSPACE_HANDOFF.md. Verify origin/main contains merged PR #25 or later and whether the MTR route-validation branch from that baseline has been merged. If it has not, continue that branch rather than duplicating it; otherwise fast-forward a clean local main and create a focused feature branch. The overview review found plausible route topology against the current MTR System Map, verified AWE/TIK/ETS/SUW names in the MTR CSV, reconciled OSM SWT to MTR SUW for comparison only, and identified RAC as the Racecourse variant. Precise geographic validation remains open because the official system map is schematic and the station CSV has no coordinates. Keep the MTR layer provisional and do not add more transit/geographic layers until detailed validation is complete. Read the relevant installed Next.js guidance before application-code edits. Update the plan/handoff with outcomes; run npm run lint and npm run build, commit conventionally, and push the branch. The user creates and merges the PR separately; do not create one.
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
