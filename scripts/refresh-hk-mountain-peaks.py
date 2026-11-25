"""Extract OSM peak nodes above 500 metres within the Hong Kong district snapshot."""

import argparse
import json
import math
from pathlib import Path
import re

import osmium
from shapely.geometry import Point, shape
from shapely.ops import unary_union
from shapely.prepared import prep


ROOT = Path(__file__).resolve().parent.parent
DISTRICTS = ROOT / "public" / "data" / "hong-kong-districts.geojson"
OUTPUT = ROOT / "public" / "data" / "hong-kong-mountain-peaks.geojson"
MIN_ELEVATION_METRES = 500


def elevation_metres(value):
    if value is None or not re.fullmatch(r"\s*-?\d+(?:\.\d+)?\s*(?:m)?\s*", value):
        return None
    result = float(value.strip().removesuffix("m").strip())
    return result if math.isfinite(result) else None


def district_area():
    with DISTRICTS.open(encoding="utf-8") as file:
        districts = json.load(file)
    if len(districts["features"]) != 18:
        raise ValueError("Expected 18 district boundaries.")
    polygons = []
    for feature in districts["features"]:
        polygon = shape(feature["geometry"])
        polygons.append(polygon if polygon.is_valid else polygon.buffer(0))
    return prep(unary_union(polygons)), districts["extractedAt"]


class PeakExtractor(osmium.SimpleHandler):
    def __init__(self, boundary):
        super().__init__()
        self.boundary = boundary
        self.features = []
        self.missing_elevation = 0
        self.unusable_elevation = 0
        self.in_scope = 0

    def node(self, node):
        if node.tags.get("natural") != "peak":
            return
        lon, lat = node.location.lon, node.location.lat
        if not (113.7 <= lon <= 114.5 and 22.1 <= lat <= 22.6):
            return
        if not self.boundary.covers(Point(lon, lat)):
            return
        self.in_scope += 1
        value = node.tags.get("ele")
        elevation = elevation_metres(value)
        if elevation is None:
            if value is None:
                self.missing_elevation += 1
            else:
                self.unusable_elevation += 1
            return
        if elevation <= MIN_ELEVATION_METRES:
            return
        name = node.tags.get("name:en") or node.tags.get("name") or "Unnamed peak"
        self.features.append({
            "type": "Feature",
            "properties": {"name": name, "elevationMetres": elevation, "osmNodeId": node.id},
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
        })


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--osm-pbf", type=Path, required=True)
    args = parser.parse_args()
    reader = osmium.io.Reader(str(args.osm_pbf))
    timestamp = reader.header().get("osmosis_replication_timestamp")
    reader.close()
    if not timestamp:
        raise ValueError("The OSM PBF is missing its replication timestamp.")
    boundary, district_timestamp = district_area()
    extractor = PeakExtractor(boundary)
    extractor.apply_file(str(args.osm_pbf))
    extractor.features.sort(key=lambda feature: feature["properties"]["osmNodeId"])
    if not extractor.features:
        raise ValueError(f"No peaks above {MIN_ELEVATION_METRES} m were found; inspect the source.")
    output = {
        "type": "FeatureCollection",
        "name": f"Hong Kong OSM peak nodes above {MIN_ELEVATION_METRES} m",
        "license": "ODbL-1.0",
        "attribution": "© OpenStreetMap contributors",
        "source": "https://download.geofabrik.de/asia/china/hong-kong.html",
        "extractedAt": timestamp,
        "districtExtractedAt": district_timestamp,
        "scope": f"OSM natural=peak nodes within the district snapshot with a numeric ele tag strictly above {MIN_ELEVATION_METRES} metres; incomplete where peaks or elevations are missing or inaccurate.",
        "peakNodesInScope": extractor.in_scope,
        "missingElevation": extractor.missing_elevation,
        "unusableElevation": extractor.unusable_elevation,
        "features": extractor.features,
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {len(extractor.features)} peaks; {extractor.missing_elevation} missing and "
          f"{extractor.unusable_elevation} unusable elevations among {extractor.in_scope} peak nodes.")
    print(f"OSM snapshot: {timestamp}; districts: {district_timestamp}")


if __name__ == "__main__":
    main()
