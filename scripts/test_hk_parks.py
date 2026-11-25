import importlib.util
from pathlib import Path
import unittest

from shapely.geometry import box


spec = importlib.util.spec_from_file_location("parks", Path(__file__).with_name("refresh-hk-parks.py"))
parks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(parks)


class ParkTests(unittest.TestCase):
    def test_classification_and_strict_threshold(self):
        self.assertEqual(parks.classify_park({"leisure": "park", "name": "City Park"}), ("urban", "City Park"))
        self.assertEqual(parks.classify_park({"boundary": "national_park", "name:en": "Lion Rock Country Park"}), ("country", "Lion Rock Country Park"))
        self.assertEqual(parks.classify_park({"leisure": "nature_reserve", "name": "Reserve"})[0], None)
        self.assertEqual(parks.classify_park({"leisure": "park", "tourism": "museum"})[0], None)
        self.assertFalse(parks.qualifies_area(4.999))
        self.assertFalse(parks.qualifies_area(5))
        self.assertTrue(parks.qualifies_area(5.001))

    def test_duplicate_relation_preferred_but_distinct_areas_preserved(self):
        def candidate(id, geometry, name="Test Park"):
            return {"kind": "country", "name": name, "geometry": geometry, "osmElementId": id}
        candidates = [
            candidate("way/1", box(0, 0, 10, 10)),
            candidate("relation/2", box(0, 0, 10, 10)),
            candidate("way/3", box(20, 20, 30, 30)),
            candidate("way/4", box(0, 0, 10, 10), name="Other Park"),
        ]
        result, removed = parks.deduplicate(candidates)
        self.assertEqual(removed, 1)
        self.assertEqual({item["osmElementId"] for item in result}, {"relation/2", "way/3", "way/4"})


if __name__ == "__main__":
    unittest.main()
