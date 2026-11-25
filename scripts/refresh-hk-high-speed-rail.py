"""Build the Hong Kong high-speed track snapshot from an OSM relation and extract."""

import argparse
from collections import defaultdict
from datetime import datetime, timezone
import io
import json
from pathlib import Path
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

import shapefile


ROOT = Path(__file__).resolve().parent.parent
RELATION_ID = "8707713"
RELATION_URL = f"https://www.openstreetmap.org/api/0.6/relation/{RELATION_ID}"
LAYER = "gis_osm_railways_free_1"


def build_snapshot(relation_xml, osm_zip, extracted_on, retrieved_on):
    root = ET.fromstring(relation_xml)
    relation = root.find(f"relation[@id='{RELATION_ID}']")
    if relation is None:
        raise ValueError(f"Missing OSM relation {RELATION_ID}.")
    tags = {tag.get("k"): tag.get("v") for tag in relation.findall("tag")}
    if tags.get("route") != "tracks" or tags.get("ref") != "XRL":
        raise ValueError("The high-speed track relation has unexpected tags.")
    ids = {member.get("ref") for member in relation.findall("member") if member.get("type") == "way"}
    if not ids:
        raise ValueError("The high-speed track relation has no ways.")

    with zipfile.ZipFile(osm_zip) as archive:
        reader = shapefile.Reader(
            shp=io.BytesIO(archive.read(f"{LAYER}.shp")),
            shx=io.BytesIO(archive.read(f"{LAYER}.shx")),
            dbf=io.BytesIO(archive.read(f"{LAYER}.dbf")),
            encoding="utf-8", encodingErrors="replace",
        )
        ways = {item.record["osm_id"]: item for item in reader.iterShapeRecords()
                if item.record["osm_id"] in ids}
    if set(ways) != ids:
        raise ValueError(f"Track relation ways missing from extract: {sorted(ids - set(ways))}")

    graph = defaultdict(set)
    lines = []
    for way_id in sorted(ids, key=int):
        item = ways[way_id]
        if item.record["fclass"] != "rail" or len(item.shape.parts) != 1 or len(item.shape.points) < 2:
            raise ValueError(f"Invalid track geometry for way {way_id}.")
        line = [list(point[:2]) for point in item.shape.points]
        lines.append(line)
        first, last = tuple(line[0]), tuple(line[-1])
        graph[first].add(last)
        graph[last].add(first)
    visited = set()
    pending = [next(iter(graph))]
    while pending:
        point = pending.pop()
        if point not in visited:
            visited.add(point)
            pending.extend(graph[point] - visited)
    if len(visited) != len(graph):
        raise ValueError("Track relation contains disconnected components.")
    if not any(abs(x - 114.165) < 0.003 and abs(y - 22.3037) < 0.004 for x, y in graph):
        raise ValueError("Track network does not reach West Kowloon station.")
    if not any(22.50 < y < 22.52 and 114.04 < x < 114.07 for x, y in graph):
        raise ValueError("Track network does not reach the northern border area.")

    return {
        "type": "FeatureCollection",
        "name": "Hong Kong high-speed railway tracks",
        "license": "ODbL-1.0",
        "attribution": "© OpenStreetMap contributors",
        "source": RELATION_URL,
        "relationVersion": relation.get("version"),
        "relationTimestamp": relation.get("timestamp"),
        "relationRetrievedOn": retrieved_on,
        "geometryExtractDownloadedOn": extracted_on,
        "geometrySource": "https://download.geofabrik.de/asia/china/hong-kong.html",
        "scope": "Hong Kong section to the border area; excludes mainland continuation to Shenzhen North. Tracks include parallel ways and station approaches.",
        "features": [{
            "type": "Feature",
            "properties": {"name": "High Speed Rail - Hong Kong section", "osmRelationId": int(RELATION_ID),
                           "osmWayIds": [int(item) for item in sorted(ids, key=int)]},
            "geometry": {"type": "MultiLineString", "coordinates": lines},
        }],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--osm-zip", type=Path, required=True)
    parser.add_argument("--extract-downloaded-on", required=True, help="Date the OSM extract was downloaded (YYYY-MM-DD)")
    args = parser.parse_args()
    datetime.strptime(args.extract_downloaded_on, "%Y-%m-%d")
    request = urllib.request.Request(RELATION_URL, headers={"User-Agent": "HideAndSeekGameSite/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        relation_xml = response.read()
    snapshot = build_snapshot(relation_xml, args.osm_zip, args.extract_downloaded_on,
                              datetime.now(timezone.utc).date().isoformat())
    output = ROOT / "public" / "data" / "hong-kong-high-speed-rail.geojson"
    output.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {len(snapshot['features'][0]['geometry']['coordinates'])} connected track ways to {output}")


if __name__ == "__main__":
    main()
