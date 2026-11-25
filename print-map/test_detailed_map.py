import unittest

import matplotlib.pyplot as plt
from pyproj import Geod

from render_detailed_map import (
    geographic_bounds,
    label_overlap_count,
    network_bounds,
    separate_labels,
    visible_districts,
)
from render_map import RADIUS_METERS, load_data, project


class DetailedMapTests(unittest.TestCase):
    def test_map_contains_each_station_and_its_full_zone(self):
        routes, stations, _ = load_data()
        xmin, xmax, ymin, ymax = network_bounds(routes, stations)
        for station in stations:
            x, y = project(*station["geometry"]["coordinates"][:2])
            self.assertLessEqual(xmin, x - RADIUS_METERS)
            self.assertGreaterEqual(xmax, x + RADIUS_METERS)
            self.assertLessEqual(ymin, y - RADIUS_METERS)
            self.assertGreaterEqual(ymax, y + RADIUS_METERS)

    def test_all_district_markers_are_visible(self):
        routes, stations, districts = load_data()
        xmin, xmax, ymin, ymax = network_bounds(routes, stations)
        visible = visible_districts(districts, geographic_bounds((xmin, xmax, ymin, ymax)))
        self.assertEqual(len(visible), 18)
        for _, (x, y) in visible:
            self.assertTrue(xmin <= x <= xmax and ymin <= y <= ymax)

    def test_500_meter_projected_circle_has_local_ground_radius(self):
        geod = Geod(ellps="WGS84")
        for longitude, latitude in ((113.94, 22.29), (114.17, 22.32), (114.27, 22.30)):
            origin = project(longitude, latitude)
            for azimuth in (0, 90, 180, 270):
                lon, lat, _ = geod.fwd(longitude, latitude, azimuth, RADIUS_METERS)
                edge = project(lon, lat)
                distance = ((edge[0] - origin[0]) ** 2 + (edge[1] - origin[1]) ** 2) ** 0.5
                self.assertLess(abs(distance - RADIUS_METERS), 0.6)

    def test_overlapping_labels_are_separated(self):
        fig, ax = plt.subplots()
        labels = [ax.text(0.5, 0.5, "First station"), ax.text(0.5, 0.5, "Second station")]
        fig.canvas.draw()
        renderer = fig.canvas.get_renderer()
        self.assertGreater(label_overlap_count(labels, renderer), 0)
        separate_labels(labels, renderer, ax)
        self.assertEqual(label_overlap_count(labels, renderer), 0)
        plt.close(fig)


if __name__ == "__main__":
    unittest.main()
