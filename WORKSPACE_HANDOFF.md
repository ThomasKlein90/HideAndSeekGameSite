# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Printable map and shared POI layers are being published from
  `feature/hong-kong-printable-poi-map`, based on `main` at `e1af1e2`.
  The latest PDF was reviewed by the user. Print-map tests, data tests, lint
  and production build passed on 2026-11-25. Review and merge the pull request
  before starting another development slice.
- Current print draft: `print-map/hong-kong-game-map-a3-focused-poi-station-legend.pdf`
  has 148 numbered POIs and station-or-district annotations in the legend.
  The museum shortlist retains the original 13 venues and adds three using a
  provisional 50,000-visit cutoff in the 2025–26 LCSD venue table; this is
  not a comprehensive city-wide ranking. The High Speed Train Line label is
  rotated close to the track. The Ocean Park aquarium is displayed
  beside the existing Ocean Park amusement symbol at its approximate park
  point; the shared web data instead uses the OSM aquarium feature. Cube O
  Discovery Park uses an approximate Plaza 88 mall point. See
  `print-map/README.md` for sources, classification rules and qualifications. This draft also
  adds the existing Hong Kong high-speed rail geometry and all six numbered
  golf entries. Five golf indicators sit at the crop edge and display a
  geodesic distance from the arrow's anchor. The airport label has a plane icon
  and distance without a POI number. Eden and New share an approximate
  Fanling site, not verified individual locations. The railway stops at the
  Hong Kong border in the source; mainland geometry is not included. Only the
  latest PDF is retained, per the user's cleanup request. No PNG preview is
  generated for the POI draft.
- Earlier PDF and PNG drafts were cleaned up; older references below are
  historical and those files have been removed.
- The previous library draft showed 138 numbered in-crop POIs, including 20
  libraries.
  The shared web dataset has 24 library branches across Hong Kong. With the
  user's approval, the proxy includes central/major branches plus district
  branches whose April 2023 HKPL directory address lists at least two floors,
  or that have a published area at least 1,600 m². This is not a verified
  floor-area ranking. Tuen Mun, Ping Shan Tin Shui Wai, Yuen Long and Tung
  Chung lie outside the focused crop. See `print-map/README.md` and the shared
  GeoJSON for sources and qualifications. Print-map and named-place tests,
  lint and build passed.
- Library research: no comprehensive, comparable current branch-by-branch
  area table was found. Evidence for 12 current-site candidates is scattered
  across sources: Hong Kong Central (33,800 m², HKPL); Ping Shan Tin Shui
  Wai (6,100 m², 2013); Sha Tin (~4,000 m²), Quarry Bay (~2,300), Shui Wo
  Street (~2,300), Lockhart Road (~2,100), Fa Yuen Street (~1,800), To Kwa
  Wan (~1,600), all approximate construction floor areas in a 2006 LegCo
  paper; Yuen Chau Kok (~2,900 m², 2017); Yuen Long (~2,900 m², 2017);
  Tsuen Wan (~3,000 m², 2021, later expansion status unverified); and Tseung
  Kwan O (2,200 m², 2001). Historical sizes and different definitions are not
  directly comparable and do not establish a top-20 ranking. Branch attendance
  is available historically for the six 2006-paper libraries (2005 figures),
  but no comprehensive current series was located. Sources:
  https://www.hkpl.gov.hk/en/about-us/HKCL/intro.html
  https://www.news.gov.hk/tc/categories/health/html/2013/02/20130225_124546.shtml
  https://www.legco.gov.hk/yr05-06/english/panels/ha/papers/ha0512cb2-1912-1e.pdf
  https://www.info.gov.hk/gia/general/201703/29/P2017032900336.htm
  https://www.info.gov.hk/gia/general/201711/20/P2017111700567.htm
  https://www.legco.gov.hk/yr20-21/english/panels/ha/papers/ha20210208cb4-463-6-e.pdf
  https://www.info.gov.hk/gia/general/200107/20/0720145.htm
  The later library draft uses the user-approved proxy described above.
- Hospital and Grassy Hill draft: `print-map/hong-kong-game-map-a3-focused-poi-hospitals.pdf`
  and its preview show 118 numbered points, including ten mountains and 22
  hospitals; Grassy Hill and Tai Mo Shan are separate. Shared web data includes
  28 hospital entries throughout Hong Kong. The provisional 500-bed selection
  combines 24 HA entries from 31 March 2025 (one is Ruttonjee and Tang Shiu Kin
  combined, pinned at Ruttonjee) and four private hospitals with less-comparable
  or uncertain figures. Gleneagles is a secondary-source boundary estimate.
  Selection is not an exhaustive ranking; see `print-map/README.md` and the
  shared GeoJSON for sources and qualifications. Libraries remain pending.
- Curated printable POI draft (2026-11-23):
  `print-map/hong-kong-game-map-a3-focused-poi-curated.pdf` and the matching
  preview contain 95 renumbered points and an updated page-2 list. Upper
  mountain clusters retain Tai Mo Shan and Ma On Shan only; the old 17/24
  group retains Tate's Cairn and old 1/45/48 retains Buffalo Hill. Lion Rock
  (495 m) and Beacon Hill (457 m) are print-only exceptions to the 550 m
  threshold. `print-map/mountain-selection.json` records selected OSM IDs;
  this consolidation also removes other named peaks including Tai To Yan and
  Grassy Hill at that time. The later draft restores Grassy Hill; the web
  mountain dataset and earlier PDFs remain unchanged.
- Numbered printable POI draft (2026-11-23):
  `print-map/hong-kong-game-map-a3-focused-poi-numbered.pdf` and its matching
  preview contain 135 uniquely numbered in-crop POIs; page 2 lists their
  numbers and names in dynamically sized category boxes. Print-only mountains
  are at least 550 m (49 points); the web layer remains strictly above 500 m.
  Airport arrow direction follows the projected airport point, with adjacent
  geodesic distance from the arrow anchor. Libraries and hospitals remain
  placeholders. The preceding unnumbered PDF remains unchanged. See
  `print-map/README.md` for details and regeneration.
- Printable POI draft (2026-11-23): `print-map/hong-kong-game-map-a3-focused-poi-draft.pdf`
  has two A3 portrait pages: a focused map with 155 in-crop POIs and a blank
  category-list template on the reverse. The separate PNG preview shows the
  map. Symbols use original vector drawings and short leader lines when moved
  to avoid collisions. The district key fits its text; an edge arrow gives the
  straight-line distance to the airport. Library and hospital data are still
  missing and have only placeholder boxes. The shared input points are
  approximate or incomplete and the crop omits out-of-bounds places. The
  previous PDF drafts are unchanged. See `print-map/README.md` for source
  details, category counts, printing and regeneration instructions.
- Cinema follow-up (2026-11-23): the user's list is represented by 23
  searchable, toggleable web-map site pins, including separate Tai Wai and
  THE SOUTHSIDE Emperor branches and separate Hollywood and Maritime Square
  CineArt branches. MCL The ONE and Broadway The ONE share a site pin because
  both names identify the same mall; operator history is not verified. Some
  pins are explicitly approximate mall positions. The list is user-selected,
  not independently checked against the former screen-count threshold. See
  `print-map/README.md` for sources. Five map-data tests, 14 print-map tests,
  lint and build passed; a mobile browser check verified the 23 cinema markers,
  layer toggle, shared-site search and both Emperor branches. The later POI
  draft above includes in-crop cinemas.
- Museum follow-up (2026-11-23): the web map has a searchable, toggleable
  layer for the user's 13 selected museums. These are an explicit game list,
  not an attendance-based selection. Coordinates are OSM/Nominatim points;
  Oil Street Art Space uses an approximate Oi! Warehouse building point.
  Details and source notes are in `print-map/README.md`; the later POI draft
  includes the in-crop museums. Five map-data tests, lint and build passed; a mobile
  browser check confirmed all 13 markers, the layer toggle, searches for M Plus
  and Oil Street, and the absence of the cinema layer.
- The temporary M+ Cinema pin was removed at the user's request; the new
  cinema layer above instead follows the subsequently provided list.
- Golf follow-up (2026-11-23): all six requested course entries are represented
  by five OSM site pins: Discovery Bay Ruby and Diamond share a club point,
  and Hong Kong Golf Club Eden and New share a Fanling site point. Both club
  websites confirm the named courses at their respective sites; individual
  course locations are not verified and the pins explicitly say approximate.
  Other golf pins are also representative locations, not course boundaries.
  Five map-data tests, lint and production build passed. A mobile browser check
  confirmed five golf markers, the layer toggle, and searches for Eden and
  Diamond. See `print-map/README.md` for sources. The later POI draft includes
  the in-crop golf site.
- Museum research: the LCSD museum portal's
  [visitor information](https://www.museums.gov.hk/en/web/portal/plan-your-visit.html)
  supplies venue names and addresses, but not comparable annual attendance
  figures. Search results were inconclusive and attempted annual-report links
  returned 404. This research was superseded by the user's explicit museum
  selection above; no attendance eligibility is inferred.
- Map follow-up: `print-map/hong-kong-game-map-a3-focused-landmasses-v2.pdf`
  moves Kowloon to the upper-right margin at the user's request (not a
  geographic label position) and Ap Lei Chau below the hiding-zone circles.
  The earlier PDFs remain unchanged; a locked prior PDF required a new name.
  `public/data/hong-kong-mountain-peaks.geojson` contains 123 OSM peak nodes
  strictly above 500 m in a searchable, toggleable web layer, including 47 unnamed points.
  OSM is incomplete/not survey-grade: 3 mapped peaks have no elevation and 1
  has an unusable value. Snapshot is 2026-11-22; exact source and regeneration
  instructions are in `print-map/README.md`. The later POI draft above includes
  the in-crop mountain points.
  User confirmed parks include both urban and country parks above 5 hectares.
  The web map now has a partial, searchable OSM layer with 47 urban/recreation
  areas and 25 country-park boundaries over 5 ha, based on full polygon area.
  It excludes museum-tagged areas, removes one duplicated relation/way, and
  treats extensions separately. Pins are representative interior points, not
  entrances; OSM mapping may be incomplete or misclassified. Park POIs have
  were later added to the separate POI draft above. Lint, production build, seven map-data tests and
  four Python selection tests passed; the mobile browser check verified both
  cutoff layers, the park toggle and country-park search.
  The PBF used to generate them is in this session's `files` directory.
- Map follow-up (2026-11-23): the separate
  `print-map/hong-kong-game-map-a3-focused-landmasses.pdf` and preview add the
  four requested landmass names; the original focused PDF remains unchanged.
  The web overlay no longer displays those four labels (the OSM base tiles
  may contain their own labels). The web map now also has a toggleable
  high-speed railway layer, generated from OSM relation 8707713 and the
  Geofabrik extract. Its 51 ways form a connected network from West Kowloon
  to the border area; the mainland continuation is not included. No POIs or
  high-speed rail were added to the print revision. See `print-map/README.md`
  for provenance, regeneration and pending work.
- POI work (2026-11-23): `public/data/hong-kong-named-places.geojson`
  contains a partial OSM/Nominatim snapshot of the airport, West Kowloon
  high-speed station, three requested amusement parks, selected zoo, three
  golf locations and Kowloon. The web map loads these independently, offers
  searchable toggleable category pins and shows the three requested island
  labels in the original implementation (superseded by the follow-up above).
  At that stage golf was partial; see the golf follow-up above. Polygon-derived
  points are approximate representatives. The focused print PDF has not been
  changed. Source details and gaps are in `print-map/README.md`. Named-place
  and island data tests, all 12 print-map tests, lint, build and diff checks
  passed. Browser checks confirmed nine accessible pins, all four requested
  landmass labels, search, the amusement-park toggle and mobile map layout.
- The prior long-running source research was cancelled without a report.
  External search challenges and an Overpass timeout remain blockers, not
  evidence of absent data. Still needed: verify individual positions of
  Discovery Bay Ruby/Diamond and Hong Kong Golf Club Eden/New if required;
  review partial park coverage and find
  comparable private hospital bed counts and library floor area. The high-speed Hong Kong track relation is now verified as
  connected as described above; its mainland continuation remains uncollected.
  Agree on comparable
  reference years/definitions where required, and do not claim completeness
  or add threshold categories based on unverified data. Keep research bounded
  and document each category separately. The user has now requested a combined
  POI PDF draft for review; several locations lie outside its crop.
- Web app development is **on hold** at the user's request while a printable
  Hong Kong game map is developed. Do not apply the pending Supabase migration
  or resume the web app until the user asks.
- Focused second draft (2026-11-18): `print-map/hong-kong-game-map-a3-focused.pdf`
  and `print-map/hong-kong-game-map-focused-preview.png` crop to the complete
  500 m zones at Tai Wo, Tsing Yi, South Horizons and LOHAS Park, with 83 named
  station zones, 16 visible numbered districts and a compact southwest legend.
  It is A3 portrait, with a 350 dpi background and vector labels/overlays;
  print at actual size. Areas outside station zones are gently dimmed. A
  true-scale bar shows 250 m, 500 m, 1 km, 2.5 km and 5 km. Per the user's
  choice, an original "HIDE + SEEK / HONG KONG" heading replaces the requested
  official logo, whose reuse permission was not verified. The wider detailed
  draft remains separate and unchanged.
- Updated print-map draft (2026-11-18): `print-map/hong-kong-game-map-a3-detailed.pdf`
  and `print-map/hong-kong-game-map-detailed-preview.png` add a quiet,
  label-free OSM-derived roads/parks/water background, station names, a tighter
  railway-network view, numbered districts and a district key. The shoreline
  is generalized Natural Earth land geometry, not a navigation-grade
  coastline. The Geofabrik and Natural Earth extracts used by the renderer are
  stored in this session's `files` directory, not in the repository. Sources,
  regeneration, dependencies and snapshot caveats are in `print-map/README.md`.
- Print-map draft: `print-map/hong-kong-game-map-a3-draft.pdf` (A3 landscape,
  actual-size printing) and `print-map/hong-kong-game-map-preview.png`. Its
  independent renderer and provenance/limitations are in `print-map/`. It
  shows the nine non-Airport-Express railway lines, 96 station centers with
  approximately 500 m zones, and 18 district outlines. Light Rail, trams,
  Airport Express and Airport-Express-only stations are excluded; shared
  stations remain. The draft uses historical snapshots and omits station names
  and a detailed coastline/basemap; obtain user feedback before further changes.
- Last verified: 2026-11-04
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Verified PR #43 (seeker category board and Radar questions) merged and branch deleted on 2026-11-04. Local `main` matches `origin/main` at `e1af1e2`.
- The PR's migration `20261104170000_question_category_rewards.sql` has not yet been applied to Supabase. The next task is to apply and verify it manually through the Supabase Dashboard; do not run `supabase db push` while migration history remains unreconciled.
- PR validation passed: `npm.cmd run test:game:radar`, `npm.cmd run test:game:check-ins`, `npm.cmd run test:game:errors`, `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check`.
- Product stage: MTR, Tramways, Light Rail, ferries, district boundaries, island labels, map search, playable/no-go district selection, seeker status, manual station check-ins, and audited corrections are integrated in `main`.

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
- Manual check-in deployment and smoke test (2026-10-14, PR #35): the district-selection prerequisite and check-in migration were applied manually in the Supabase Dashboard. Catalog checks confirmed the district-aware game-creation function and setting, and the check-in table, RPC, RLS, and expected policy. Using two disposable test accounts on the matching local app, game creation and team assignment succeeded; a fresh Seeker report appeared to Hiders; the Hider station remained hidden from a non-host Seeker; Central-to-Central produced the expected within-radius advisory; changing the Seeker report to Tuen Mun showed outside-radius and removed the alert. The phase did not change. A separate disposable Hider test then showed its Central report remained visible and changed from Fresh to Stale after 19 minutes. The four-account/mobile test remains.
- Check-in correction slice (2026-10-14, PR #37): the host can inspect and correct all player reports, including Hider reports when assigned to Seekers; non-host visibility remains team-scoped. Only the host can read correction history. Corrections can change station and reported time, preserve previous/corrected values with actor and correction time, and are blocked once a game is complete. Migration `20261014160000_game_checkin_corrections.sql` was applied manually through Dashboard and its catalog checks passed.
- Correction validation: `npm.cmd run test:game:check-ins` passes four tests, including datetime-local round-tripping; `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check` pass. Authenticated two-account smoke test passed: the host corrected a Seeker station and reported time, the before/after values and correction time appeared in history, the Seeker saw the corrected current report without correction controls/history, and after ending the disposable game the correction form was disabled. The SQL RPC also rejects corrections when phase is `game_complete`; a direct post-completion RPC call was not made because the client form was disabled. Do not run `supabase db push` because manually deployed migration history is not reconciled.
- Retention and stale-label follow-up (2026-10-14): a read-only query against completed `Check-in smoke test` returned both Hider and Seeker `game_checkins` rows, confirming retention after completion. A separate disposable Hider game confirmed the live stale state: after reporting Central as Fresh, the user waited 19 minutes and observed the same report still visible as Stale.

## Current Development Slice

MTR routes, Hong Kong Tramways, MTR Light Rail, ferries, district boundaries, island labels, map search, and playable/no-go district selection are integrated into `main` through PR #33 (`89982eb`). Source details and validation history are recorded above.

PR #34 added the dedicated seeker-status panel (seeker assignment and roster only, no check-ins or location sharing) and is merged and closed.

PR #35 added manual station check-ins and is merged and closed. Local `main` was fast-forwarded to `9308528`, matching `origin/main`.

PR #37 added host-only audited check-in corrections and is merged and closed. Local `main` was fast-forwarded to `1aa5e1d`, matching `origin/main`.

Migrations `20261012170000_game_playable_districts.sql`, `20261014140000_game_station_checkins.sql`, and `20261014160000_game_checkin_corrections.sql` were applied manually through the Supabase Dashboard and verified with read-only catalog checks. `supabase_migrations.schema_migrations` is absent, so CLI migration history is not reconciled; do not run `supabase db push` until safely resolved.

The two-account check-in smoke test passed creation/assignment, Seeker report visibility, Hider-location privacy from non-host Seekers, inside/outside radius behavior, alert removal, and no automatic phase transition. The stale state was also confirmed live: in a separate disposable Hider game, Central remained visible and was marked Stale after 19 minutes. The two-account correction smoke test passed station/time correction, audit before/after values and correction time, corrected report visibility to the Seeker, no correction controls/history in the Seeker UI, and disabled correction form after ending the disposable game. Direct RPC rejection after game completion was not separately invoked; its server-side guard is present in the verified migration. The four-account mobile test remains.

The live stale-age UI is verified: a disposable Hider check-in remained visible and changed from Fresh to Stale after 19 minutes. The read-only query against the earlier completed smoke-test game also verified the Hider and Seeker rows remain stored.

## Current Development and Next Validation

PR #41 adds actionable join messages for unknown codes, full games, and network
failures. PR #42 refreshes check-ins when connectivity returns or the page
becomes active, skips overlapping loads, and warns when displayed reports may
be out of date after refresh failure. PR #43 adds the six seeker categories
with agreed colors and draw/pick rewards, multiple-template browsing, and nine
fixed Radar yes/no distance prompts (400 m through 150 km) plus one custom
yes/no distance from 1 m through 150 km. Each Radar template can be used once
per round; the database unique index enforces this, and the Seeker UI shows
used options.

The merged PR migration `20261104170000_question_category_rewards.sql` updates
category rewards, deactivates all six old placeholders, adds and validates
custom Radar distances, seeds the 10 Radar templates, and restricts Seeker
inserts to pending questions in the game's active round. It is not yet applied
to Supabase. The next task is to apply it manually through the Supabase
Dashboard and verify the schema, seeded templates, inactive placeholders, and
RLS policy. First check whether the migration has already been applied to avoid
reapplying it. Do not run `supabase db push`: `supabase_migrations.schema_migrations`
is absent and migration history is unreconciled.

The screenshot is used only as reference for category names/colors and reward
counts. The Radar question wording was supplied by the user. Do not copy card
artwork or proprietary question wording. After applying and verifying the
migration, collect the group's original Matching, Measuring, Thermometer,
Tentacles, and Photos prompts and agree on answer/evidence requirements.
Then scope automatic Radar answers using explicit checkpoints from the
existing manual check-in system. Agree on eligible checkpoint sources,
freshness, privacy/visibility, and missing/stale behavior first. This must not
introduce continuous GPS tracking or live-location sharing. The four-account
mobile smoke test remains deferred.

The four-account smoke test on real mobile phones remains pending until the
user is available. When run, use a disposable game; confirm join/team
assignment, role-scoped check-in visibility, proximity advisories, and
host-controlled phase changes. Note mobile layout, navigation, readability,
touch-target, accessibility, and one-handed-use problems. No Supabase action
is needed before this test. Record results in this handoff and `PROJECT_PLAN.md`.

After the ordered question-catalogue and checkpoint-based Radar follow-ups,
review submission, answer, and reward behavior with the group. The four-account
smoke test on real mobile phones remains deferred until the user is available.
The project has no join-code expiration field or behavior, so explicit
"expired invite" handling needs a product decision rather than being inferred
from an invalid code. The post-completion correction RPC denial remains
untested. Broad branding/cosmetic polish can wait, but mobile usability and
accessibility issues found in testing are functional and should be addressed.
Ferry OSM refresh/pier coverage remains a parallel map-maintenance follow-up.

## Start-Of-Session Procedure

1. Open the repository at the workspace root.
2. Read this file, [PROJECT_PLAN.md](PROJECT_PLAN.md), and the repository instructions.
3. Verify `origin/main`; PR #43 is merged, and local `main` matches `origin/main` at `e1af1e2`.
4. The district-selection, check-in, and correction migrations were manually applied through Dashboard and verified via catalog queries. The migration-history table is absent, so reconcile CLI history before any `supabase db push`.
5. Two-account check-in/correction tests and the live stale-age UI passed. PR #41 added join-error feedback; PR #42 added reconnect/page-return check-in refresh and stale-data warnings; PR #43 added the category board and Radar templates and is merged. The immediate next task is to apply and verify `20261104170000_question_category_rewards.sql` manually through the Supabase Dashboard; first check whether it has already been applied. Do not run `supabase db push` until migration history is reconciled. Then collect the remaining categories' original prompts and requirements, followed by scoping automatic Radar answers against explicit manual location checkpoints with agreed freshness and privacy behavior. Do not introduce continuous GPS/live-location sharing or automatic phase changes. The four-phone smoke test remains deferred.

### Copy-ready restart prompt

```
Resume from WORKSPACE_HANDOFF.md. Web app development is paused while the user works on a printable Hong Kong game map; continue with feedback on `print-map/hong-kong-game-map-a3-focused.pdf` and `print-map/hong-kong-game-map-focused-preview.png`. This A3 portrait draft crops the wider separate A3 landscape draft to the full zones around Tai Wo, Tsing Yi, South Horizons and LOHAS Park. It includes a quiet OSM-derived background, 83 named station centers with approximately 500 m zones, 16 visible numbered districts and a compact southwest legend; background is 350 dpi with vector labels and overlays. The wider map remains `print-map/hong-kong-game-map-a3-detailed.pdf`. Exclude Light Rail, trams, Airport Express, and Airport-Express-only stations; keep stations shared with an included railway line. The generalized Natural Earth coastline is not navigation-grade. Read `print-map/README.md` for sources, print instructions, dependencies, and accuracy/coverage limitations. Preserve the existing uncommitted project-plan and handoff updates. Do not resume the web app or apply its Supabase migration until the user asks. When resumed, PR #43 is merged at `e1af1e2`; the pending migration `supabase/migrations/20261104170000_question_category_rewards.sql` must first be checked, then applied and verified manually through the Supabase Dashboard. Do not run `supabase db push` because `supabase_migrations.schema_migrations` is absent and history is unreconciled. Later, collect original remaining question prompts and answer/evidence requirements, then scope Radar answers from explicit manual checkpoints, including freshness, privacy, and missing/stale behavior. Do not introduce continuous GPS tracking. The four-phone smoke test remains deferred; direct post-completion correction RPC denial remains untested. Read relevant installed Next.js guidance before app edits. The user creates and merges PRs separately.
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
