import unittest

import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from shapely.geometry import LineString, Point, Polygon, box

from render_focused_map import (
    EDGE_MARGIN_METERS,
    LANDMASS_NAMES,
    SCALE_MARKS_METERS,
    assert_legend_clear,
    draw_graduated_scale,
    draw_high_speed_rail,
    draw_high_speed_label,
    draw_landmass_labels,
    focused_bounds,
    focused_districts,
    focused_stations,
    fit_district_legend,
    load_landmass_points,
    load_high_speed_lines,
    legend_bounds,
    outside_zone_mask,
)
from render_map import RADIUS_METERS, load_data, project


class FocusedMapTests(unittest.TestCase):
    def setUp(self):
        self.routes, self.stations, self.districts = load_data()
        self.bounds = focused_bounds(self.stations)
        self.included = focused_stations(self.stations, self.bounds)
        self.centers = {
            station["properties"]["stationCode"]: project(*station["geometry"]["coordinates"][:2])
            for station in self.stations
        }

    def test_extent_is_anchored_to_the_four_requested_stations(self):
        xmin, xmax, ymin, ymax = self.bounds
        self.assertAlmostEqual(xmin, self.centers["TSY"][0] - EDGE_MARGIN_METERS)
        self.assertAlmostEqual(xmax, self.centers["LHP"][0] + EDGE_MARGIN_METERS)
        self.assertAlmostEqual(ymin, self.centers["SOH"][1] - EDGE_MARGIN_METERS)
        self.assertAlmostEqual(ymax, self.centers["TWO"][1] + EDGE_MARGIN_METERS)
        codes = {station["properties"]["stationCode"] for station in self.included}
        self.assertEqual(len(codes), 83)
        self.assertTrue({"TSY", "LHP", "SOH", "TWO"}.issubset(codes))
        self.assertTrue({"LOW", "LMC", "TUC", "SUN", "TUM"}.isdisjoint(codes))

    def test_all_included_hiding_zones_fit_within_the_crop(self):
        xmin, xmax, ymin, ymax = self.bounds
        for station in self.included:
            x, y = project(*station["geometry"]["coordinates"][:2])
            self.assertLessEqual(xmin, x - RADIUS_METERS)
            self.assertGreaterEqual(xmax, x + RADIUS_METERS)
            self.assertLessEqual(ymin, y - RADIUS_METERS)
            self.assertGreaterEqual(ymax, y + RADIUS_METERS)

    def test_legend_does_not_cover_a_zone_or_railway(self):
        assert_legend_clear(self.routes, self.stations, self.bounds)

    def test_high_speed_rail_uses_shared_geometry_and_is_clipped_to_map(self):
        import json
        from render_map import ROOT
        with (ROOT / "public" / "data" / "hong-kong-high-speed-rail.geojson").open(encoding="utf-8") as file:
            data = json.load(file)
        coordinates = data["features"][0]["geometry"]["coordinates"]
        lines = load_high_speed_lines()
        self.assertEqual(len(lines), len(coordinates))
        self.assertEqual(len(lines), 51)
        self.assertAlmostEqual(lines[0][0][0], project(*coordinates[0][0])[0], places=4)
        self.assertAlmostEqual(lines[0][0][1], project(*coordinates[0][0])[1], places=4)
        fig, ax = plt.subplots()
        collection = draw_high_speed_rail(ax, lines)
        self.assertTrue(collection.get_clip_on())
        self.assertEqual(len(collection.get_segments()), len(lines))
        self.assertIs(collection.axes, ax)
        plt.close(fig)

    def test_high_speed_label_is_west_of_rail_and_above_tsuen_wan(self):
        fig = plt.figure(figsize=(297 / 25.4, 420 / 25.4))
        ax = fig.add_axes([0.025, 0.026, 0.95, 0.95])
        ax.set_xlim(self.bounds[0], self.bounds[1])
        ax.set_ylim(self.bounds[2], self.bounds[3])
        ax.set_aspect("equal")
        label = draw_high_speed_label(ax)
        fig.canvas.draw()
        patch = label.get_bbox_patch()
        vertices = patch.get_path().transformed(patch.get_transform()).vertices
        area = Polygon(ax.transData.inverted().transform(vertices))
        lines = [LineString(line) for line in load_high_speed_lines()]
        self.assertEqual(label.get_text(), "High Speed Train Line")
        self.assertTrue(all(not area.intersects(line) for line in lines))
        self.assertGreater(area.bounds[1], self.centers["TSW"][1])
        nearest = min(lines, key=lambda line: line.distance(area))
        self.assertLess(area.centroid.x, nearest.interpolate(nearest.project(area.centroid)).x)
        self.assertLess(nearest.distance(area), 1000)
        self.assertEqual(label.get_rotation(), 310)
        plt.close(fig)

    def test_legend_width_fits_longest_text_with_padding(self):
        fig, ax = plt.subplots()
        ax.set_xlim(0, 100)
        ax.set_ylim(0, 100)
        patch = Rectangle((5, 5), 80, 50)
        ax.add_patch(patch)
        texts = [ax.text(7, 40, "Central and Western", fontsize=7),
                 ax.text(7, 30, "Tai Po", fontsize=7)]
        fit_district_legend(ax, patch, texts)
        renderer = fig.canvas.get_renderer()
        right = patch.get_window_extent(renderer).x1
        widest = max(text.get_window_extent(renderer).x1 for text in texts)
        self.assertAlmostEqual(right - widest, renderer.points_to_pixels(4))
        self.assertLess(patch.get_width(), 80)
        plt.close(fig)

    def test_district_markers_are_visible_and_avoid_legend(self):
        xmin, xmax, ymin, ymax = self.bounds
        legend = box(*legend_bounds(self.bounds))
        districts = focused_districts(self.districts, self.bounds)
        self.assertEqual(len(districts), 16)
        for _, (x, y) in districts:
            self.assertTrue(xmin <= x <= xmax and ymin <= y <= ymax)
            self.assertFalse(legend.covers(Point(x, y)))

    def test_outside_mask_excludes_station_zones_including_overlaps(self):
        mask = outside_zone_mask([(1000, 1000), (1500, 1000)], (0, 3000, 0, 3000))
        self.assertTrue(mask.covers(Point(100, 100)))
        self.assertFalse(mask.covers(Point(1000, 1000)))
        self.assertFalse(mask.covers(Point(1250, 1000)))
        self.assertFalse(mask.covers(Point(1500, 1000)))

    def test_scale_segments_and_labels_are_at_true_map_distances(self):
        fig, ax = plt.subplots()
        draw_graduated_scale(ax, 10000, 20000)
        segments = ax.patches[1:]
        self.assertEqual(len(segments), 5)
        for patch, start, end in zip(segments, SCALE_MARKS_METERS, SCALE_MARKS_METERS[1:]):
            self.assertAlmostEqual(patch.get_x(), 10000 + start)
            self.assertAlmostEqual(patch.get_width(), end - start)
        for label, distance in zip(ax.texts, SCALE_MARKS_METERS):
            self.assertAlmostEqual(label.get_position()[0], 10000 + distance)
        self.assertEqual([text.get_text() for text in ax.texts],
                         ["0", "250", "500 m", "1 km", "2.5 km", "5 km"])
        plt.close(fig)

    def test_requested_landmass_points_are_sourced_and_in_crop(self):
        points = load_landmass_points()
        self.assertEqual(set(points), set(LANDMASS_NAMES))
        xmin, xmax, ymin, ymax = self.bounds
        for x, y in points.values():
            self.assertTrue(xmin <= x <= xmax and ymin <= y <= ymax)

    def test_requested_landmass_label_layout(self):
        fig, ax = plt.subplots()
        xmin, xmax, ymin, ymax = self.bounds
        ax.set_xlim(xmin, xmax)
        ax.set_ylim(ymin, ymax)
        labels = {label.get_text(): label for label in draw_landmass_labels(ax, load_landmass_points())}
        kowloon_x, kowloon_y = labels["Kowloon"].get_position()
        self.assertGreater(kowloon_x, xmin + 0.9 * (xmax - xmin))
        self.assertGreater(kowloon_y, ymin + 0.9 * (ymax - ymin))
        ap_x, ap_y = labels["Ap Lei Chau"].get_position()
        for code in ("SOH", "LET"):
            center_x, center_y = self.centers[code]
            self.assertLess(ap_y, center_y - RADIUS_METERS)
        self.assertGreater(ap_y, ymin)
        self.assertGreater(ap_x, xmin)
        plt.close(fig)


if __name__ == "__main__":
    unittest.main()
