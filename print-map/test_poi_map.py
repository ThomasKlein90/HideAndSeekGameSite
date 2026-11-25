import unittest
from collections import Counter

import matplotlib.pyplot as plt
from matplotlib.transforms import Bbox
from pyproj import Geod

from poi_map import (
    POI_CATEGORIES, airport_indicator, annotate_legend_pois, draw_off_map_golf, draw_pois, include_print_peak, legend_page,
    load_pois, load_print_mountain_selection, symbol, validate_hospital,
)
from render_focused_map import focused_bounds
from render_detailed_map import TRANSFORMER
from render_map import load_data, project


class PoiMapTests(unittest.TestCase):
    def setUp(self):
        _, stations, _ = load_data()
        self.bounds = focused_bounds(stations)

    def test_included_points_respect_crop_and_selection(self):
        records = load_pois(self.bounds)
        counts = Counter(record["category"] for record in records)
        self.assertEqual(len(records), 148)
        self.assertEqual(counts["mountain"], 10)
        self.assertEqual(counts["high-speed station"], 1)
        self.assertEqual(counts["museum"], 16)
        self.assertEqual(counts["library"], 20)
        self.assertEqual(counts["hospital"], 22)
        self.assertEqual(counts["golf"], 6)
        self.assertEqual(counts["aquarium"], 2)
        self.assertNotIn("airport", counts)
        for record in records:
            x, y = record["point"]
            in_crop = self.bounds[0] <= x <= self.bounds[1] and self.bounds[2] <= y <= self.bounds[3]
            self.assertEqual(not in_crop, record.get("off_map", False))
            if not in_crop:
                self.assertEqual(record["category"], "golf")
        self.assertEqual([record["number"] for record in records], list(range(1, len(records) + 1)))
        import json
        from render_map import ROOT
        with (ROOT / "public" / "data" / "hong-kong-mountain-peaks.geojson").open(encoding="utf-8") as file:
            peaks = json.load(file)["features"]
        selection = load_print_mountain_selection()
        removed = {str(node) for group in selection["groups"] for node in group["remove"]}
        expected = {
            str(peak["properties"]["osmNodeId"])
            for peak in peaks
            if peak["properties"]["elevationMetres"] >= 550
            and self.bounds[0] <= project(*peak["geometry"]["coordinates"])[0] <= self.bounds[1]
            and self.bounds[2] <= project(*peak["geometry"]["coordinates"])[1] <= self.bounds[3]
        } - removed
        expected.update(str(peak["osmNodeId"]) for peak in selection["exceptions"])
        self.assertEqual({p["identity"] for p in records if p["category"] == "mountain"}, expected)
        self.assertFalse(include_print_peak(549.999))
        self.assertTrue(include_print_peak(550))
        self.assertTrue(include_print_peak(550.001))

    def test_hospital_capacity_validation(self):
        props = {"name": "Example", "beds": 500, "bedBasis": "reported", "bedSource": "https://example.com"}
        validate_hospital(props)
        for invalid in (499, float("nan"), True):
            with self.assertRaises(ValueError):
                validate_hospital({**props, "beds": invalid})
        with self.assertRaises(ValueError):
            validate_hospital({**props, "bedSource": ""})

    def test_ocean_park_aquarium_is_printed_next_to_park_symbol(self):
        records = load_pois(self.bounds)
        park = next(p for p in records if p["identity"] == "relation/3676813")
        aquarium = next(p for p in records if p["identity"] == "way/96936293")
        cube = next(p for p in records if p["identity"] == "way/856650723")
        self.assertEqual(park["point"], aquarium["point"])
        self.assertIn("approximate park site", aquarium["name"])
        self.assertEqual(cube["point"], project(114.1158082, 22.3673274))
        fig, ax = plt.subplots(figsize=(8, 11))
        ax.set_xlim(self.bounds[0], self.bounds[1])
        ax.set_ylim(self.bounds[2], self.bounds[3])
        ax.set_aspect("equal")
        draw_pois(ax, [park, aquarium], [], [])
        fig.canvas.draw()
        boxes = [artist.get_window_extent(fig.canvas.get_renderer()) for artist in ax.artists]
        self.assertEqual(len(boxes), 2)
        self.assertFalse(boxes[0].overlaps(boxes[1]))
        distance = ((boxes[0].x0 - boxes[1].x0) ** 2 + (boxes[0].y0 - boxes[1].y0) ** 2) ** 0.5
        self.assertLess(distance, 30 * fig.dpi / 72)
        plt.close(fig)

    def test_curated_groups_keep_specified_highest_peaks(self):
        import json
        from render_map import ROOT
        with (ROOT / "public" / "data" / "hong-kong-mountain-peaks.geojson").open(encoding="utf-8") as file:
            peaks = {feature["properties"]["osmNodeId"]: feature["properties"]
                     for feature in json.load(file)["features"]}
        selection = load_print_mountain_selection()
        kept = {p["identity"]: p for p in load_pois(self.bounds) if p["category"] == "mountain"}
        self.assertEqual([group["keep"] for group in selection["groups"]],
                         [1852935107, 714977855, 1167607524, 1263051656])
        for group in selection["groups"]:
            self.assertIn(str(group["keep"]), kept)
            self.assertTrue(all(str(node) not in kept for node in group["remove"]))
            self.assertGreaterEqual(peaks[group["keep"]]["elevationMetres"],
                                    max(peaks[node]["elevationMetres"] for node in group["remove"]))
        self.assertEqual(kept["1102121339"]["name"], "Grassy Hill")
        self.assertEqual(kept["1852935107"]["name"], "Tai Mo Shan")
        self.assertEqual({p["name"] for p in selection["exceptions"]}, {"Lion Rock", "Beacon Hill"})
        for peak in selection["exceptions"]:
            self.assertIn(str(peak["osmNodeId"]), kept)
            self.assertLess(peak["elevationMetres"], 550)
            self.assertEqual(kept[str(peak["osmNodeId"])]["point"], project(*peak["coordinates"]))

    def test_every_category_has_a_symbol_and_a_back_page_box(self):
        records = load_pois(self.bounds)
        routes, stations, districts = load_data()
        fig = legend_page(records, routes, stations, districts)
        self.assertEqual(len(fig.axes[0].patches), len(POI_CATEGORIES))
        lines = [text.get_text() for text in fig.axes[0].texts]
        for record in records:
            self.assertTrue(any(line.startswith(f"{record['number']}. ") for line in lines))
        for category in POI_CATEGORIES:
            self.assertGreater(len(symbol(category).get_children()), 1)
        self.assertFalse(any("approximate" in text.get_text().lower() for text in fig.axes[0].texts))
        self.assertFalse(any("Dashed purple railway" in text.get_text() or "Locations are approximate" in text.get_text()
                             for text in fig.texts))
        explanation = next(text for text in fig.texts if text.get_text().startswith("In brackets:"))
        fig.canvas.draw()
        renderer = fig.canvas.get_renderer()
        explanation_box = explanation.get_window_extent(renderer)
        intro_box = fig.texts[1].get_window_extent(renderer)
        top_box = max(patch.get_window_extent(renderer).y1 for patch in fig.axes[0].patches)
        self.assertLess(explanation_box.y1, intro_box.y0)
        self.assertGreater(explanation_box.y0, top_box)
        self.assertLess(explanation_box.x1, fig.bbox.x1)
        station_suffix = next(text for text in fig.axes[0].texts if text.get_text().strip() == "(Chai Wan)")
        self.assertEqual(station_suffix.get_color(), "#007dc5")
        district_suffix = next(text for text in fig.axes[0].texts if "(Sha Tin)" in text.get_text()
                               and text.get_color() == "#202020")
        self.assertEqual(district_suffix.get_color(), "#202020")
        self.assertEqual(tuple(round(n) for n in fig.get_size_inches() * 25.4), (297, 420))
        plt.close(fig)

    def test_legend_uses_original_points_nearest_zone_and_district(self):
        routes, stations, districts = load_data()
        station = next(s for s in stations if s["properties"]["stationCode"] == "TSW")
        x, y = project(*station["geometry"]["coordinates"][:2])
        points = [{"name": "Inside", "point": (x + 499.9, y)},
                  {"name": "Boundary", "point": (x + 500, y)},
                  {"name": "Outside", "point": (x + 500.1, y)}]
        result = annotate_legend_pois(points, routes, [station], districts)
        self.assertEqual([p["legend_location"] for p in result], ["Tsuen Wan", "Tsuen Wan", "Tsuen Wan"])
        self.assertEqual([p["legend_color"] for p in result], ["#ed1d24", "#ed1d24", "#202020"])
        records = load_pois(self.bounds)
        aquarium = next(p for p in records if p["identity"] == "way/96936293")
        self.assertNotEqual(aquarium["reference_point"], aquarium["point"])
        actual = annotate_legend_pois([aquarium], routes, stations, districts)[0]
        displayed = annotate_legend_pois([{**aquarium, "reference_point": aquarium["point"]}],
                                         routes, stations, districts)[0]
        self.assertNotEqual(actual["legend_location"], displayed["legend_location"])

    def test_closest_station_and_interchange_color(self):
        routes, stations, districts = load_data()
        interchange = next(s for s in stations if s["properties"]["stationCode"] == "ADM")
        nearby = next(s for s in stations if s["properties"]["stationCode"] == "CEN")
        point = project(*interchange["geometry"]["coordinates"][:2])
        result = annotate_legend_pois([{"name": "Test", "point": point}], routes,
                                      [nearby, interchange], districts)[0]
        self.assertEqual(result["legend_location"], interchange["properties"]["name"])
        colors = {r["properties"]["lineCode"]: r["properties"]["color"] for r in routes}
        first_line = next(line for line in interchange["properties"]["lineCodes"] if line in colors)
        self.assertEqual(result["legend_color"], colors[first_line])

    def test_six_golf_courses_and_directional_edge_markers(self):
        records = [p for p in load_pois(self.bounds) if p["category"] == "golf"]
        self.assertEqual(len(records), 6)
        self.assertEqual(len({p["number"] for p in records}), 6)
        self.assertEqual(len({p["identity"] for p in records}), 6)
        fanling = [p for p in records if "Hong Kong Golf Club" in p["name"]]
        self.assertEqual(len(fanling), 2)
        self.assertTrue(any("Eden" in p["name"] for p in fanling))
        self.assertTrue(any("New" in p["name"] for p in fanling))
        self.assertEqual(fanling[0]["point"], fanling[1]["point"])
        outside = [p for p in records if p.get("off_map")]
        self.assertEqual(len(outside), 5)
        self.assertEqual([p["name"] for p in records if not p.get("off_map")], ["Shek O Country Club"])
        fig, ax = plt.subplots(figsize=(8, 11))
        ax.set_xlim(self.bounds[0], self.bounds[1])
        ax.set_ylim(self.bounds[2], self.bounds[3])
        ax.set_aspect("equal")
        markers = draw_off_map_golf(ax, outside, [], [])
        fig.canvas.draw()
        canvas = ax.get_window_extent(fig.canvas.get_renderer())
        for marker in markers:
            x, y = marker["anchor"]
            target_x, target_y = marker["poi"]["point"]
            dx, dy = marker["direction"]
            self.assertAlmostEqual(dx * (target_y - y) - dy * (target_x - x), 0, places=6)
            self.assertGreater(dx * (target_x - x) + dy * (target_y - y), 0)
            lon, lat = TRANSFORMER.transform(x, y, direction="INVERSE")
            tlon, tlat = TRANSFORMER.transform(target_x, target_y, direction="INVERSE")
            _, _, distance = Geod(ellps="WGS84").inv(lon, lat, tlon, tlat)
            self.assertAlmostEqual(marker["distance"], distance)
            children = marker["annotation"].offsetbox.get_children()
            self.assertEqual(children[-1].get_text(), f"{distance / 1000:.1f} km")
            self.assertEqual(children[1].get_text(), str(marker["poi"]["number"]))
            self.assertEqual(len(children), 3)
            arrow = marker["arrow"]
            self.assertEqual(arrow.get_position(), marker["anchor"])
            arrow_dx, arrow_dy = arrow.xy[0] - x, arrow.xy[1] - y
            self.assertAlmostEqual(arrow_dx * dy - arrow_dy * dx, 0, places=6)
            self.assertGreater(arrow_dx * dx + arrow_dy * dy, 0)
            label_box = marker["annotation"].get_window_extent(fig.canvas.get_renderer())
            self.assertFalse(label_box.contains(*ax.transData.transform(marker["anchor"])))
            self.assertFalse(label_box.contains(*ax.transData.transform(arrow.xy)))
            self.assertTrue(canvas.contains(marker["bbox"].x0, marker["bbox"].y0))
            self.assertTrue(canvas.contains(marker["bbox"].x1, marker["bbox"].y1))
            self.assertLess(min(marker["bbox"].x0 - canvas.x0, canvas.x1 - marker["bbox"].x1,
                                marker["bbox"].y0 - canvas.y0, canvas.y1 - marker["bbox"].y1),
                            20 * fig.dpi / 72)
        for index, marker in enumerate(markers):
            self.assertFalse(any(marker["bbox"].overlaps(other["bbox"]) for other in markers[:index]))
        fanling_anchors = [m["anchor"] for m in markers if m["poi"] in fanling]
        self.assertNotEqual(*fanling_anchors)
        moved = draw_off_map_golf(ax, [outside[0]], [markers[0]["bbox"]], [])
        self.assertFalse(moved[0]["bbox"].overlaps(markers[0]["bbox"]))
        plt.close(fig)

    def test_airport_distance_and_bearing_are_from_arrow_anchor(self):
        fig, ax = plt.subplots()
        ax.set_xlim(self.bounds[0], self.bounds[1])
        ax.set_ylim(self.bounds[2], self.bounds[3])
        airport = (113.9172999, 22.3125986)
        anchor, distance, bearing = airport_indicator(ax, airport, [])
        lon, lat = TRANSFORMER.transform(*anchor, direction="INVERSE")
        expected_bearing, _, expected_distance = Geod(ellps="WGS84").inv(lon, lat, *airport)
        self.assertAlmostEqual(distance, expected_distance)
        self.assertAlmostEqual(bearing, expected_bearing)
        arrow = ax.texts[0]
        direction = (arrow.xy[0] - anchor[0], arrow.xy[1] - anchor[1])
        target = project(*airport)
        target_direction = (target[0] - anchor[0], target[1] - anchor[1])
        self.assertAlmostEqual(direction[0] * target_direction[1] - direction[1] * target_direction[0], 0, places=5)
        self.assertGreater(direction[0] * target_direction[0] + direction[1] * target_direction[1], 0)
        self.assertLess(project(*airport)[0], self.bounds[0])
        label = ax.artists[0]
        children = label.offsetbox.get_children()
        self.assertGreater(len(children[0].get_children()), 0)
        self.assertEqual(children[1].get_text(), f"HK Airport\n{distance / 1000:.1f} km")
        self.assertEqual(label.xybox, (4, 0))
        plt.close(fig)

    def test_colliding_icons_are_shifted_and_connected(self):
        fig, ax = plt.subplots()
        ax.set_xlim(0, 100)
        ax.set_ylim(0, 100)
        pois = [{"name": "First", "category": "mountain", "point": (50, 50), "number": 1},
                {"name": "Second", "category": "park", "point": (50, 50), "number": 2}]
        self.assertEqual(draw_pois(ax, pois, [], []), 1)
        self.assertEqual(len(ax.lines), 1)
        fig.canvas.draw()
        icons = [artist for artist in ax.artists if hasattr(artist, "offsetbox")]
        boxes = [artist.get_window_extent(fig.canvas.get_renderer()) for artist in icons]
        self.assertFalse(Bbox.overlaps(*boxes))
        plt.close(fig)


if __name__ == "__main__":
    unittest.main()
