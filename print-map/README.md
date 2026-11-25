# Hong Kong printable game map

`hong-kong-game-map-a3-focused-poi-station-legend.pdf` is the current two-page A3
portrait draft. It contains 148 numbered POIs: 143 in-crop locations and five
off-crop golf indicators, including ten mountains, 20 libraries and 22
hospitals, with a matching legend on page 2.
Print at actual size, using portrait long-edge duplex; test the orientation.

The museum shortlist preserves the original 13 requested venues and adds three
from the government's [2025–26 attendance table](https://www.info.gov.hk/gia/general/202606/17/P2026061700569.htm):
Fireboat Alexander Grantham Exhibition Gallery (83,082 visits), Hong Kong
Visual Arts Centre (61,174) and Hong Kong Film Archive (104,491). A provisional
50,000-visit cutoff selects 13 of the 17 LCSD venues in that table, including
these three and ten original selections. The other three original venues, M+,
Hong Kong Palace Museum and Hong Kong Maritime Museum, are retained without
claiming a comparable attendance figure. The LCSD table includes art spaces
and the Film Archive and is not a comprehensive Hong Kong-wide museum census;
closures and exhibitions can affect annual attendance. This is a practical
16-venue shortlist, not a city-wide attendance ranking. The added locations
are approximate OSM reference points, not verified entrances.

Legend parentheses identify the closest included MTR station within 500 m
of each POI reference point, or its district if no station qualifies. Station
names use the first included line's colour in the station's source line order;
interchanges can also serve other lines. District names are black. Distances
use the same projected coordinates as the map's hiding-zone disks, and district
boundary ties use alphabetical order. All included stations are considered,
including outside the crop; for the current POIs none of the closest qualifying
stations is outside the crop. Golf indicators use their target site rather than
the arrow anchor. Ocean Park Grand Aquarium uses its mapped aquarium location
for this classification, not the intentionally shifted print symbol. Names omit
approximate-location parentheticals only in the legend.

The two upper mountain clusters were consolidated to Tai Mo Shan and Ma On
Shan; this deliberately removes other named peaks in those areas, including
Tai To Yan. Grassy Hill has been restored separately from Tai Mo Shan.
The former 17/24 group keeps Tate's Cairn and the
former 1/45/48 group keeps Buffalo Hill. Lion Rock (495 m) and Beacon Hill
(457 m) are explicit print-only exceptions to the 550 m minimum. The source
OSM nodes and exact selections are documented in `mountain-selection.json`
and originate from the 2026-11-22 Geofabrik OSM extract. The shared web-map
mountain layer remains unchanged. Numbers are regenerated for this draft;
earlier PDF drafts may use different numbers.

The two selected aquariums are Ocean Park's Grand Aquarium and Cube O
Discovery Park. The web map uses the [OSM Grand Aquarium feature](https://www.openstreetmap.org/way/96936293).
On the print map, as requested, the aquarium symbol is placed next to the
amusement park symbol at the existing approximate Ocean Park site point,
not at the separately mapped aquarium building. Cube O is shown at the
approximate [Plaza 88](https://www.openstreetmap.org/way/856650723) mall
point, not its individual entrance; the venue's [listing](https://www.google.com/maps/search/?api=1&query=Cube%20O%20Discovery%20Park%20Tsuen%20Wan)
places it in that mall. The two OSM reference points were retrieved on
2026-11-25. Locations and current operating status are not independently
verified.

The provisional library selection contains 24 HKPL branches throughout Hong
Kong, 20 of them inside the focused print crop. Following user approval to use
a proxy rather than a verified floor-area ranking, it includes the central and
major libraries in [HKPL's April 2023 directory](https://www.hkpl.gov.hk/en/common/attachments/about-us/services/library_list_eng.pdf),
plus district libraries whose directory address lists at least two floors.
Two further district branches, Tseung Kwan O and Yuen Chau Kok, have published
areas above 1,600 m² even though that directory does not specify their number
of floors. The area threshold is inclusive. This is a practical shortlist,
not the largest 24 libraries: floor count is a weak size proxy, other district
libraries can be larger, and the 2023 directory may be outdated.

Twelve selections have separately published area figures retained with source
and year in `public/data/hong-kong-named-places.geojson`; some are construction
floor areas from 2006 and cannot be equated confidently with other floor-area
definitions or present-day sizes. The [2006 LegCo paper](https://www.legco.gov.hk/yr05-06/english/panels/ha/papers/ha0512cb2-1912-1e.pdf)
also reports 2005 attendance for six libraries, but no current comprehensive
per-branch visitor series was found. The four selected branches outside the PDF
crop are Tuen Mun, Ping Shan Tin Shui Wai, Yuen Long and Tung Chung. Library
locations come from the local OSM snapshot and are approximate.

The provisional hospital selection uses a **500-bed** cutoff, producing 28
Hong Kong-wide entries (22 inside the focused map). It includes 24 entries
from the [Hospital Authority 2024–2025 statistical report](https://www3.ha.org.hk/data/HAStatistics/DownloadReport/15?isPreview=False),
Table 2, as at 31 March 2025, and four private hospitals. HA totals include
non-acute and specialist beds. The HA reports Ruttonjee and Tang Shiu Kin as
one combined 658-bed entry; its single map pin is at Ruttonjee, not a claim
that each site independently qualifies.

Private figures use hospital descriptions: [Sanatorium](https://www.hksh.com/about-hksh/li-shu-fan-medical-foundation/hong-kong-sanatorium-hospital)
over 600 beds, [Baptist](https://www.hkbh.org.hk/about-us/about-hkbh/?lang=en)
over 680, and [St. Teresa's](https://www.sth.org.hk/background.asp?lang_code=en)
around 1,000. These webpages are undated and their definitions may differ from
HA's figures. [Gleneagles](https://en.wikipedia.org/wiki/Gleneagles_Hospital_Hong_Kong)
is provisionally included at the boundary based on a secondary source reporting
500 beds without a date or bed definition; its current operational count is
unverified. The stored numbers for "over" and "around" are thresholds or
approximations, not exact counts. Private hospital research is incomplete, so
this is not an exhaustive ranking. Hospital OSM site points use the local
Geofabrik extract or Nominatim and are approximate, not verified entrances.
Per-entry bed basis, source and OSM identity are in the shared GeoJSON.

Numbers are unique across categories and may change if the source data changes.
Crowded symbols can move from their reference positions and short
leader lines connect them to those positions; positions are approximate, not
entrances or survey-grade locations. The airport is outside the crop; the
western-edge arrow points towards its OSM reference point, with the geodesic
straight-line distance measured from the arrow's map anchor. Map symbols use
original vector artwork.

The six numbered golf entries include Shek O inside the crop and five
edge indicators pointing towards the remaining courses. Each distance is a
WGS84 geodesic from the start of the displayed arrow to its approximate
site point, rounded to one decimal kilometre. The separately numbered Eden
and New entries use the same approximate Fanling site point, not verified
individual course positions. Discovery Bay Ruby and Diamond remain one
requested combined entry.

To generate the current two-page draft:

```powershell
python print-map\render_focused_map.py --osm-zip "C:\path\hong-kong-latest-free.shp.zip" --land-zip "C:\path\ne_10m_land.zip" --landmass-labels --pois
```

The current map labels Hong Kong Island, Kowloon, Tsing Yi and Ap Lei Chau.
It uses the OSM island-label and named-place
datasets in `public/data`; the positions are orientation labels, not
landmass boundaries. Kowloon is deliberately moved to the upper-right margin
for readability rather than placed over Kowloon; Ap Lei Chau is below the
station-zone circles.

The focused map crops to
Tai Wo in the north, Tsing Yi in the west, South Horizons in the south and
LOHAS Park in the east. It shows 83 complete station zones and the 16
districts visible within that crop; the compact district key overlays the
southwest corner without covering any railway line or 500 m station zone. The
top-left heading is original text, not the official Jet Lag logo. The
background is rendered at 350 dpi in the PDF, while lines, labels and circles
remain vector graphics. The POI draft does not create a PNG preview; non-POI
drafts still create one.
Areas outside the union of the 500 m zones are
gently dimmed; overlapping zones are not darkened. The bottom-right scale bar
shows true map distances at 250 m, 500 m, 1 km, 2.5 km and 5 km. The `250`
label is in metres, as indicated by the adjacent `500 m` label.

No fold marks are printed.

The map uses the repository's 2026-09-28 OpenStreetMap (OSM) MTR snapshot
(including its supplemental station points) and 2026-10-07 district boundary
snapshot. The wider map shows nine railway lines, 96 labeled station-center points, 18
numbered district boundaries, and a district key. Light Rail, trams and Airport
Express are excluded, including Airport Express-only stations; interchanges
shared with another displayed railway line remain. The locations are the
project's OSM-derived station centers, not exits. Circles show an approximately
500 m ground distance using WGS84 UTM zone 50N; the station points and
boundaries are reference data, not survey-grade measurements or official
gameplay determinations.

The background is a custom, label-free rendering of roads, land use, parks and
water from the [Geofabrik Hong Kong OSM extract](https://download.geofabrik.de/asia/china/hong-kong.html)
downloaded 2026-11-18, with coastline/land from
[Natural Earth 1:10m land](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/),
which is public domain. It is not the standard OSM tile style; the coastline is
generalized and is not suitable for precise coastal navigation. The data
sources have different snapshot dates; the historical railway snapshot may
omit newer railway changes. Check current station and route coverage and agree
on the game's actual eligibility rules before relying on the map.

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright),
available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/).
The print map also carries attribution. The railway and district source files
and their provenance remain in `public/data/mtr-osm.geojson` and
`public/data/hong-kong-districts.geojson`. The public OSM tile server is not
used to create or prefetch this printable map.

## Selected places for the web map

`public/data/hong-kong-named-places.geojson` is a partial shared reference
dataset. Its in-crop POIs are rendered in the current draft. It contains the airport, West Kowloon
high-speed station, the three requested amusement parks, the selected zoo,
two aquariums,
five golf-site pins representing the six requested course entries, 16 selected
museums, 23 user-selected cinema site pins, the provisional
hospital and library selections, and a Kowloon label. Most coordinates and
OSM element identifiers were retrieved from
[OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) on 2026-11-23;
some locations are mapped nodes and others are representative points of mapped
areas, not necessarily entrances or course centres. Data © OpenStreetMap
contributors, ODbL 1.0.

Discovery Bay Ruby and Diamond share a club-location pin; Hong Kong Golf Club
Eden and New share a Fanling site pin, not verified positions of the individual
courses. The [Discovery Bay club](https://www.dbgc.hk/icms/template?series=367&article=5613&lang=EN)
confirms Ruby and Diamond are separate nine-hole courses; the
[Hong Kong Golf Club](https://hkgolfclub.org/web/pages/courses) confirms
the Eden and New courses are at Fanling. Their geometry-derived OSM site
points are approximate, as are the other golf pins. Do not treat them as
course boundaries, entrances, or exact individual course centres.
The museum layer combines the user's explicit list with the three attendance-based
additions described above. Oil Street Art Space is represented approximately by the mapped
Oi! Warehouse building within its site, not a verified entrance. The
[LCSD museum visitor information](https://www.museums.gov.hk/en/web/portal/plan-your-visit.html)
lists addresses for many selected venues; the
[Hong Kong Maritime Museum](https://www.hkmaritimemuseum.org/) confirms its
location at Central Pier 8.

The cinema layer follows the user's explicit list rather than independently
verified screen counts. The [WMOOV cinema directory](https://m.wmoov.com/cinema)
lists current venues and their addresses, including both Emperor Plus+ branches
and both CineArt branches. Locations use OSM cinema objects where available;
otherwise pins explicitly identify approximate mall or site locations, not
cinema entrances. OSM's older Broadway The ONE cinema node and WMOOV's MCL
The ONE listing refer to the same mall, so the two requested names share one
site pin; their operator history and exact positions are not independently
verified. Cinemas within the crop are shown in the current draft.
The library selection is a provisional category-and-floor proxy, not a verified
top-20 ranking.
The simplified
Geofabrik shapefiles used for the background do not provide the elevations,
attendance, screen counts, bed counts or library areas needed to select those
categories; park polygon areas can be measured, but classification and
duplicates still need review. Search and source requests encountered blocked pages and
an Overpass timeout; do not infer missing data from those failures.
The [Hong Kong Public Libraries directory](https://www.hkpl.gov.hk/en/locations/libraries.html)
is a potential starting point for library identities; it has not yet supplied
a verified, comparable top-20 floor-area ranking.

`public/data/hong-kong-mountain-peaks.geojson` is a separate, shared web-map
snapshot of OSM `natural=peak` nodes with a numeric `ele` strictly above 500 m
and inside the OSM Hong Kong district boundary snapshot. It contains 123
points, of which 47 have no name; 3 other mapped peak nodes lack elevation and
1 has an unrecognized value. The layer can be toggled and searched by name.
Missing or inaccurate OSM peak and elevation tags mean this is not a complete
or survey-grade mountain inventory. OSM node IDs, elevation values, the
2026-11-22 OSM replication timestamp and district timestamp are retained in
the dataset. In-crop mountains are shown in the current PDF draft.

`public/data/hong-kong-parks.geojson` is a partial web-map reference layer:
47 OSM `leisure=park` urban/recreation areas (excluding entries also tagged
as museums) and 25 OSM country-park boundaries, each with a measured full
polygon area strictly above 5 hectares. Areas are computed in UTM 50N from
the 2026-11-22 OSM extract; the point is an interior representative location
inside the district snapshot, not an entrance or boundary. One duplicate
way/relation geometry was removed. Extensions are separate OSM features.
The park tagging and geometry can be incomplete, overlapping or incorrect;
promenades and recreation grounds mapped as parks are included. Country park
representative points can be far from their entrances. This is not a definitive
game-eligibility inventory. In-crop parks are shown in the current PDF draft.

The web map also uses `public/data/hong-kong-high-speed-rail.geojson`: the 51
ways in [OSM relation 8707713](https://www.openstreetmap.org/relation/8707713),
version 11, queried on 2026-11-23, matched against the Geofabrik geometry
downloaded on 2026-11-18. All member ways are present and form one connected
network from West Kowloon to the Hong Kong border area. This is the Hong Kong
section only; the mainland continuation to Shenzhen North is not included.
It shows parallel tracks and station approaches, not a single cartographic
centreline. The focused POI PDF draws the same geometry clipped to its crop as
a dashed purple line; it does not invent the mainland continuation.

## Regeneration

These renderers are independent of the web app. Install the Python libraries in
`requirements.txt`. Download the Geofabrik
[`hong-kong-latest-free.shp.zip`](https://download.geofabrik.de/asia/china/hong-kong-latest-free.shp.zip)
and Natural Earth [`ne_10m_land.zip`](https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_land.zip)
separately. The "latest" extract changes over time, so preserve the downloaded
file if an identical snapshot is needed.

Run from the repository root, substituting the actual paths:

```powershell
python print-map\render_detailed_map.py --osm-zip "C:\path\hong-kong-latest-free.shp.zip" --land-zip "C:\path\ne_10m_land.zip"
python print-map\render_focused_map.py --osm-zip "C:\path\hong-kong-latest-free.shp.zip" --land-zip "C:\path\ne_10m_land.zip"
python print-map\render_focused_map.py --osm-zip "C:\path\hong-kong-latest-free.shp.zip" --land-zip "C:\path\ne_10m_land.zip" --landmass-labels
python scripts\refresh-hk-high-speed-rail.py --osm-zip "C:\path\hong-kong-latest-free.shp.zip" --extract-downloaded-on 2026-11-18
python -m pip install -r scripts\requirements-map.txt
python scripts\refresh-hk-mountain-peaks.py --osm-pbf "C:\path\hong-kong-latest.osm.pbf"
python scripts\refresh-hk-parks.py --osm-pbf "C:\path\hong-kong-latest.osm.pbf"
python -m unittest discover -s scripts -p "test_hk_*.py" -v
python -m unittest discover -s print-map -p "test_*.py" -v
```

The mountain generator also uses Shapely from the print-map requirements. Its
PBF input is the [Geofabrik Hong Kong extract](https://download.geofabrik.de/asia/china/hong-kong.html);
preserve the input file to reproduce the dated snapshot.

The simpler first draft can still be regenerated with
`python print-map\render_map.py`. Station names use automated collision
avoidance and may need a manual print-readability review after source or layout
changes.
