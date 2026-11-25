"""Extract OSM urban and country park areas strictly larger than five hectares."""

import argparse
import importlib.util
import json
from pathlib import Path

import osmium
from pyproj import Transformer
from shapely import wkb
from shapely.geometry import Point
from shapely.ops import transform


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public" / "data" / "hong-kong-parks.geojson"
spec = importlib.util.spec_from_file_location("mountain_peaks", Path(__file__).with_name("refresh-hk-mountain-peaks.py"))
peaks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(peaks)
project = Transformer.from_crs(4326, 32650, always_xy=True).transform
MIN_AREA_HECTARES = 5


def classify_park(tags):
    name = tags.get("name:en") or tags.get("name") or ""
    if tags.get("boundary") == "national_park" and "Country Park" in name:
        return "country", name
    if tags.get("leisure") == "park" and tags.get("tourism") != "museum":
        return "urban", name
    return None, name


def qualifies_area(area_hectares):
    return area_hectares > MIN_AREA_HECTARES


class ParkExtractor(osmium.SimpleHandler):
    def __init__(self, boundary):
        super().__init__()
        self.boundary = boundary
        self.factory = osmium.geom.WKBFactory()
        self.candidates = []

    def area(self, area):
        kind, name = classify_park(area.tags)
        if kind is None:
            return
        geometry = wkb.loads(self.factory.create_multipolygon(area), hex=True)
        if not geometry.is_valid:
            geometry = geometry.buffer(0)
        if geometry.is_empty:
            raise ValueError(f"Empty park geometry: {area.orig_id()}")
        representative = geometry.representative_point()
        if not self.boundary.covers(Point(representative.x, representative.y)):
            return
        area_hectares = transform(project, geometry).area / 10000
        if not qualifies_area(area_hectares):
            return
        self.candidates.append({
            "kind": kind, "name": name, "geometry": geometry,
            "point": representative, "areaHectares": area_hectares,
            "osmElementId": f"{'way' if area.from_way() else 'relation'}/{area.orig_id()}",
        })


def deduplicate(candidates):
    result = []
    duplicate_count = 0
    for candidate in sorted(candidates, key=lambda item: (not item["osmElementId"].startswith("relation/"), item["osmElementId"])):
        duplicate = next((item for item in result if candidate["name"]
                          and item["kind"] == candidate["kind"]
                          and item["name"].casefold() == candidate["name"].casefold()
                          and item["geometry"].intersection(candidate["geometry"]).area
                          >= 0.98 * max(item["geometry"].area, candidate["geometry"].area)), None)
        if duplicate:
            duplicate_count += 1
        else:
            result.append(candidate)
    return result, duplicate_count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--osm-pbf", type=Path, required=True)
    args = parser.parse_args()
    reader = osmium.io.Reader(str(args.osm_pbf))
    timestamp = reader.header().get("osmosis_replication_timestamp")
    reader.close()
    if not timestamp:
        raise ValueError("The OSM PBF is missing its replication timestamp.")
    boundary, district_timestamp = peaks.district_area()
    extractor = ParkExtractor(boundary)
    extractor.apply_file(str(args.osm_pbf), locations=True)
    parks, duplicate_count = deduplicate(extractor.candidates)
    if not any(item["kind"] == "urban" for item in parks) or not any(item["kind"] == "country" for item in parks):
        raise ValueError("Missing urban or country park results; inspect the source.")
    features = [{
        "type": "Feature",
        "properties": {"name": item["name"] or "Unnamed park", "parkType": item["kind"],
                       "areaHectares": item["areaHectares"],
                       "osmElementId": item["osmElementId"]},
        "geometry": {"type": "Point", "coordinates": [item["point"].x, item["point"].y]},
    } for item in sorted(parks, key=lambda item: (item["kind"], item["name"], item["osmElementId"]))]
    output = {
        "type": "FeatureCollection", "name": "Hong Kong OSM urban and country parks above 5 ha",
        "license": "ODbL-1.0", "attribution": "© OpenStreetMap contributors",
        "source": "https://download.geofabrik.de/asia/china/hong-kong.html",
        "extractedAt": timestamp, "districtExtractedAt": district_timestamp,
        "scope": "Partial OSM leisure=park areas (excluding tourism=museum) and country-park national_park boundaries, strictly greater than 5 hectares in UTM 50N; full mapped area, representative point inside district snapshot. Individual OSM areas may be incomplete, overlapping or misclassified.",
        "duplicateAreasRemoved": duplicate_count, "features": features,
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {len(features)} parks; removed {duplicate_count} duplicate geometries.")


if __name__ == "__main__":
    main()
