import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest

from shapely.geometry import box
from shapely.prepared import prep


SCRIPT = Path(__file__).with_name("refresh-hk-mountain-peaks.py")
spec = importlib.util.spec_from_file_location("mountain_peaks", SCRIPT)
peaks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(peaks)


class MountainPeakTests(unittest.TestCase):
    def test_elevation_parsing(self):
        for value in ("500", "500 m", " 500.5m "):
            self.assertIsNotNone(peaks.elevation_metres(value))
        for value in (None, "96.9;97.5", "1300 ft", "NaN", "infinity"):
            self.assertIsNone(peaks.elevation_metres(value))

    def test_selection_is_strict_and_tracks_missing_values(self):
        extractor = peaks.PeakExtractor(prep(box(113.8, 22.2, 114.2, 22.5)))
        def node(id, elevation, lon=114.1):
            tags = {"natural": "peak", "name:en": f"Peak {id}"}
            if elevation is not None:
                tags["ele"] = elevation
            return SimpleNamespace(id=id, tags=tags, location=SimpleNamespace(lon=lon, lat=22.3))
        for item in (node(1, "500"), node(2, "500.1 m"), node(3, None),
                     node(4, "500;510"), node(5, "600", lon=114.3),
                     node(6, "499.9")):
            extractor.node(item)
        self.assertEqual(extractor.in_scope, 5)
        self.assertEqual(extractor.missing_elevation, 1)
        self.assertEqual(extractor.unusable_elevation, 1)
        self.assertEqual(len(extractor.features), 1)
        self.assertEqual(extractor.features[0]["properties"]["elevationMetres"], 500.1)
        self.assertEqual(extractor.features[0]["properties"]["osmNodeId"], 2)


if __name__ == "__main__":
    unittest.main()
