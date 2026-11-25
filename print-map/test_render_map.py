import math
import unittest

from render_map import RADIUS_METERS, load_data, project


class PrintMapTests(unittest.TestCase):
    def test_requested_coverage_and_exclusions(self):
        routes, stations, districts = load_data()
        line_codes = {route["properties"]["lineCode"] for route in routes}
        station_codes = {station["properties"]["stationCode"] for station in stations}
        self.assertEqual(len(line_codes), 9)
        self.assertEqual(len(station_codes), 96)
        self.assertEqual(len(districts), 18)
        self.assertNotIn("AEL", line_codes)
        self.assertTrue({"AIR", "AWE"}.isdisjoint(station_codes))
        self.assertTrue({"HOK", "KOW", "TSY"}.issubset(station_codes))
        self.assertEqual(RADIUS_METERS, 500)

    def test_projection_origin_and_local_metre_scale(self):
        x, y = project(117, 0)
        self.assertAlmostEqual(x, 500000, places=5)
        self.assertAlmostEqual(y, 0, places=5)

        longitude, latitude = 114.17, 22.32
        x1, y1 = project(longitude, latitude)
        x2, y2 = project(longitude, latitude + 0.001)
        a = 6378137.0
        e2 = 0.0066943799901413165
        lat = math.radians(latitude)
        meridional_radius = a * (1 - e2) / (1 - e2 * math.sin(lat) ** 2) ** 1.5
        ground_distance = meridional_radius * math.radians(0.001)
        self.assertLess(abs(math.hypot(x2 - x1, y2 - y1) / ground_distance - 1), 0.001)


if __name__ == "__main__":
    unittest.main()
