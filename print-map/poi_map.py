"""Shared-data POIs and compact vector symbols for the focused print map."""

import json
import math
import re

import matplotlib.pyplot as plt
from matplotlib.offsetbox import AnnotationBbox, DrawingArea, HPacker, TextArea
from matplotlib.patches import Circle, Polygon, Rectangle
from matplotlib.lines import Line2D
from pyproj import Geod
from matplotlib.transforms import Bbox
from shapely.geometry import Point, shape
from shapely.ops import transform

from render_map import RADIUS_METERS, ROOT, project
from render_detailed_map import TRANSFORMER


POI_CATEGORIES = {
    "mountain": ("Mountains", "#80552e"),
    "park": ("Parks", "#31804c"),
    "cinema": ("Cinemas", "#222222"),
    "golf": ("Golf courses", "#2168ad"),
    "museum": ("Museums", "#777777"),
    "zoo": ("Zoo", "#df852d"),
    "amusement park": ("Amusement parks", "#793b91"),
    "aquarium": ("Aquariums", "#087c92"),
    "library": ("Libraries", "#793b91"),
    "hospital": ("Hospitals", "#c83232"),
    "high-speed station": ("High-speed station", "#253d57"),
}
SELECTED_NAMED = {"cinema", "golf", "museum", "zoo", "amusement park", "aquarium", "library", "hospital", "high-speed station"}
GEOD = Geod(ellps="WGS84")
PRINT_MOUNTAIN_MIN_METRES = 550
HOSPITAL_MIN_BEDS = 500


def include_print_peak(elevation):
    return elevation >= PRINT_MOUNTAIN_MIN_METRES


def validate_hospital(props):
    beds = props.get("beds")
    if (isinstance(beds, bool) or not isinstance(beds, (int, float))
            or not math.isfinite(beds) or beds < HOSPITAL_MIN_BEDS
            or not props.get("bedBasis") or not props.get("bedSource")):
        raise ValueError(f"Invalid hospital capacity or source: {props.get('name')}")


def load_print_mountain_selection():
    with (ROOT / "print-map" / "mountain-selection.json").open(encoding="utf-8") as file:
        return json.load(file)


def load_pois(bounds):
    """Return in-crop POIs and the selected out-of-crop golf courses."""
    data_dir = ROOT / "public" / "data"
    records = []
    selection = load_print_mountain_selection()
    removed = {str(node) for group in selection["groups"] for node in group["remove"]}
    for filename, category in (
        ("hong-kong-named-places.geojson", None),
        ("hong-kong-mountain-peaks.geojson", "mountain"),
        ("hong-kong-parks.geojson", "park"),
    ):
        with (data_dir / filename).open(encoding="utf-8") as file:
            data = json.load(file)
        if category is None:
            parks = [feature for feature in data["features"]
                     if feature["properties"].get("osmElementId") == "relation/3676813"]
            if len(parks) != 1:
                raise ValueError("Expected one Ocean Park reference point.")
            ocean_park_point = project(*parks[0]["geometry"]["coordinates"][:2])
        for feature in data["features"]:
            props = feature["properties"]
            kind = category or props["category"]
            if kind not in POI_CATEGORIES or (category is None and kind not in SELECTED_NAMED):
                continue
            if kind == "hospital":
                validate_hospital(props)
            if kind == "mountain" and not include_print_peak(props["elevationMetres"]):
                continue
            x, y = project(*feature["geometry"]["coordinates"][:2])
            reference_point = (x, y)
            if kind == "aquarium" and props.get("osmElementId") == "way/96936293":
                x, y = ocean_park_point
            in_crop = bounds[0] <= x <= bounds[1] and bounds[2] <= y <= bounds[3]
            if in_crop or kind == "golf":
                name = props["name"]
                if kind == "aquarium" and props.get("osmElementId") == "way/96936293":
                    name += " (approximate park site)"
                if kind == "mountain" and name == "Unnamed peak":
                    name = f"Unnamed peak ({props['elevationMetres']:g} m; OSM {props['osmNodeId']})"
                identity = str(props.get("osmElementId", props.get("osmNodeId", "")))
                if kind == "mountain" and identity in removed:
                    continue
                if not identity:
                    raise ValueError(f"Missing OSM identity for {name}")
                record = {"name": name, "category": kind, "point": (x, y),
                          "reference_point": reference_point, "identity": identity, "off_map": not in_crop}
                if kind == "golf" and name == "Hong Kong Golf Club - Eden and New (approximate shared site)":
                    for course in ("Eden", "New"):
                        records.append({**record, "name": f"Hong Kong Golf Club - {course} (approximate shared site)",
                                        "identity": f"{identity}:{course.lower()}"})
                else:
                    records.append(record)
    for peak in selection["exceptions"]:
        x, y = project(*peak["coordinates"])
        if bounds[0] <= x <= bounds[1] and bounds[2] <= y <= bounds[3]:
            records.append({"name": peak["name"], "category": "mountain",
                            "point": (x, y), "identity": str(peak["osmNodeId"])})
    records.sort(key=lambda poi: (list(POI_CATEGORIES).index(poi["category"]),
                                  poi["name"].casefold(), poi["identity"]))
    for number, record in enumerate(records, 1):
        record["number"] = number
    return records


def symbol(category, size=12):
    """Draw original vector pictograms, in a small white halo for legibility."""
    color = POI_CATEGORIES[category][1]
    drawing = DrawingArea(size, size, 0, 0)
    scale = size / 12

    def poly(points, fill=color, edge=None, width=0.5):
        drawing.add_artist(Polygon([(x * scale, y * scale) for x, y in points],
                                   closed=True, facecolor=fill, edgecolor=edge or fill,
                                   linewidth=width * scale))

    def line(points, stroke=color, width=0.8):
        drawing.add_artist(Line2D([x * scale for x, _ in points],
                                  [y * scale for _, y in points],
                                  color=stroke, linewidth=width * scale))

    def circle(x, y, radius, fill=color):
        drawing.add_artist(Circle((x * scale, y * scale), radius * scale,
                                  facecolor=fill, edgecolor="none"))

    drawing.add_artist(Circle((size / 2, size / 2), size * 0.51,
                              facecolor="white", edgecolor="white", linewidth=1))
    if category == "mountain":
        poly([(1, 2), (6, 11), (11, 2)])
    elif category == "park":
        poly([(5, 1), (7, 1), (7, 4), (5, 4)])
        poly([(1, 3), (3.5, 6), (2.5, 6), (6, 11), (9.5, 6), (8.5, 6), (11, 3)])
    elif category == "cinema":
        poly([(1, 2), (11, 2), (11, 8), (1, 8)], "#222222")
        poly([(1, 8), (10.5, 10.5), (11, 9), (1.5, 6.5)], "#222222")
        line([(3, 8), (4.5, 9.5)], "white", 1)
        line([(6, 8.8), (7.5, 10.2)], "white", 1)
        line([(3, 4), (9, 4)], "white", 0.6)
    elif category == "golf":
        line([(4, 1), (4, 11)], color, 1)
        poly([(4, 11), (10, 9), (4, 7)])
        line([(2, 1), (8, 1)], color, 0.7)
    elif category == "museum":
        poly([(1, 8), (6, 11), (11, 8)])
        poly([(1, 1), (11, 1), (11, 2.5), (1, 2.5)])
        for x in (2, 5, 8):
            poly([(x, 3), (x + 1.5, 3), (x + 1.5, 7), (x, 7)])
    elif category == "zoo":
        circle(6, 4, 2.7)
        for x, y in ((2, 7), (4.5, 9), (7.5, 9), (10, 7)):
            circle(x, y, 1.2)
    elif category == "amusement park":
        line([(1, 2), (11, 2)], color, 1)
        line([(2, 2), (2, 8), (4, 10), (6, 8), (8, 5), (10, 7), (11, 10)], color, 1)
        for x, height in ((4, 10), (6, 8), (8, 5), (10, 7)):
            line([(x, 2), (x, height)], color, 0.55)
    elif category == "aquarium":
        poly([(1, 6), (3, 8), (6, 9), (9, 8), (10, 6),
              (9, 4), (6, 3), (3, 4)])
        poly([(2, 6), (0.5, 8), (0.5, 4)])
        circle(8, 6.7, 0.55, "white")
    elif category == "library":
        poly([(1, 2), (5.8, 1), (6, 9), (1, 10)])
        poly([(6.2, 1), (11, 2), (11, 10), (6, 9)])
        line([(6, 1), (6, 9)], "white", 0.7)
    elif category == "hospital":
        line([(3, 2), (3, 10)], color, 2)
        line([(9, 2), (9, 10)], color, 2)
        line([(3, 6), (9, 6)], color, 2)
    elif category == "high-speed station":
        poly([(2, 2), (2, 10), (3, 11), (9, 11), (10, 10), (10, 2)])
        poly([(3, 6), (9, 6), (9, 9.5), (3, 9.5)], "white")
        circle(4, 3.5, 0.7, "white")
        circle(8, 3.5, 0.7, "white")
        line([(3, 2), (2, 0.5)], color, 1)
        line([(9, 2), (10, 0.5)], color, 1)
    return drawing


def airport_indicator(ax, airport_lonlat, obstacles):
    xmin, xmax = ax.get_xlim()
    ymin, ymax = ax.get_ylim()
    anchor = (xmin + (xmax - xmin) * 0.018, ymin + (ymax - ymin) * 0.44)
    lon, lat = TRANSFORMER.transform(*anchor, direction="INVERSE")
    azimuth, _, distance = GEOD.inv(lon, lat, *airport_lonlat)
    airport_x, airport_y = project(*airport_lonlat)
    delta_x, delta_y = airport_x - anchor[0], airport_y - anchor[1]
    length = math.hypot(delta_x, delta_y)
    dx, dy = delta_x / length, delta_y / length
    plane = DrawingArea(12, 12, 0, 0)
    plane.add_artist(Polygon([(6, 11), (7, 10), (7, 7), (11, 4), (11, 3),
                              (7, 4), (7, 2), (8.5, 1), (8.5, 0.5),
                              (6, 1), (3.5, 0.5), (3.5, 1), (5, 2),
                              (5, 4), (1, 3), (1, 4), (5, 7), (5, 10)],
                             closed=True, facecolor="#174b68", edgecolor="none"))
    graphic = HPacker(children=[
        plane,
        TextArea(f"HK Airport\n{distance / 1000:.1f} km",
                 textprops={"fontsize": 6.5, "color": "#174b68"}),
    ], align="center", pad=0, sep=2)
    label = AnnotationBbox(graphic, anchor, xybox=(4, 0), xycoords="data",
                           boxcoords="offset points", box_alignment=(0, 0.5),
                           frameon=True, pad=0.15,
                           bboxprops={"facecolor": "white", "edgecolor": "none", "alpha": 0.85},
                           zorder=10)
    ax.add_artist(label)
    ax.annotate("", xy=(anchor[0] + dx * 280, anchor[1] + dy * 280),
                xytext=anchor, arrowprops={"arrowstyle": "-|>", "color": "#174b68", "lw": 1},
                zorder=10)
    ax.figure.canvas.draw()
    obstacles.append(label.get_window_extent(ax.figure.canvas.get_renderer()).expanded(1.1, 1.2))
    return anchor, distance, azimuth


def golf_edge_metrics(anchor, target):
    """Get the projected arrow direction and geodesic distance from the displayed anchor."""
    dx, dy = target[0] - anchor[0], target[1] - anchor[1]
    length = math.hypot(dx, dy)
    if not length:
        raise ValueError("Golf edge anchor must differ from its target.")
    lon, lat = TRANSFORMER.transform(*anchor, direction="INVERSE")
    target_lon, target_lat = TRANSFORMER.transform(*target, direction="INVERSE")
    _, _, distance = GEOD.inv(lon, lat, target_lon, target_lat)
    return (dx / length, dy / length), distance


def draw_off_map_golf(ax, pois, obstacles, station_centers):
    """Place numbered, directional golf markers just inside the nearest map edge."""
    fig = ax.figure
    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    canvas = ax.get_window_extent(renderer)
    occupied = list(obstacles)
    for center in station_centers:
        x, y = ax.transData.transform(center)
        occupied.append(Bbox.from_extents(x - 3, y - 3, x + 3, y + 3))
    xmin, xmax = ax.get_xlim()
    ymin, ymax = ax.get_ylim()
    pixels_per_point = fig.dpi / 72
    placed = []
    for poi in pois:
        tx, ty = poi["point"]
        overflow = {
            "left": (xmin - tx) / (xmax - xmin),
            "right": (tx - xmax) / (xmax - xmin),
            "bottom": (ymin - ty) / (ymax - ymin),
            "top": (ty - ymax) / (ymax - ymin),
        }
        side = max(overflow, key=overflow.get)
        if overflow[side] <= 0:
            raise ValueError(f"Golf target is not outside the map: {poi['name']}")
        target_px, target_py = ax.transData.transform(poi["point"])
        horizontal = side in ("top", "bottom")
        along = target_px if horizontal else target_py
        low, high = (canvas.x0, canvas.x1) if horizontal else (canvas.y0, canvas.y1)
        along = min(max(along, low), high)
        candidates = [0]
        for offset in range(10, int((high - low) / pixels_per_point) + 10, 10):
            candidates.extend((offset, -offset))
        graphic = HPacker(children=[
            symbol("golf", 10),
            TextArea(str(poi["number"]), textprops={"fontsize": 6.5, "fontweight": "bold"}),
            TextArea("99.9 km", textprops={"fontsize": 6.5, "color": "#174b68"}),
        ], align="center", pad=0, sep=3)
        graphic.set_figure(fig)
        measured = graphic.get_window_extent(renderer)
        half_width = measured.width / 2 + 3 * pixels_per_point
        half_height = measured.height / 2 + 3 * pixels_per_point
        clearance = 17 * pixels_per_point
        for offset in candidates:
            shifted = along + offset * pixels_per_point
            px = shifted if horizontal else (canvas.x0 + half_width + clearance if side == "left" else canvas.x1 - half_width - clearance)
            py = shifted if not horizontal else (canvas.y0 + half_height + clearance if side == "bottom" else canvas.y1 - half_height - clearance)
            dx, dy = target_px - px, target_py - py
            length = math.hypot(dx, dy)
            dx, dy = dx / length, dy / length
            edge_distance = min(half_width / abs(dx) if dx else math.inf,
                                half_height / abs(dy) if dy else math.inf)
            start_x = px + dx * (edge_distance + 2 * pixels_per_point)
            start_y = py + dy * (edge_distance + 2 * pixels_per_point)
            tip_x = start_x + dx * 11 * pixels_per_point
            tip_y = start_y + dy * 11 * pixels_per_point
            arrow_padding = 2 * pixels_per_point
            bbox = Bbox.from_extents(min(px - half_width, start_x - arrow_padding, tip_x - arrow_padding),
                                     min(py - half_height, start_y - arrow_padding, tip_y - arrow_padding),
                                     max(px + half_width, start_x + arrow_padding, tip_x + arrow_padding),
                                     max(py + half_height, start_y + arrow_padding, tip_y + arrow_padding))
            if (canvas.contains(bbox.x0, bbox.y0) and canvas.contains(bbox.x1, bbox.y1)
                    and not any(bbox.overlaps(other) for other in occupied)):
                break
        else:
            raise RuntimeError(f"No non-overlapping edge position for {poi['name']}")
        anchor = tuple(ax.transData.inverted().transform((start_x, start_y)))
        tip = tuple(ax.transData.inverted().transform((tip_x, tip_y)))
        label_point = tuple(ax.transData.inverted().transform((px, py)))
        direction, distance = golf_edge_metrics(anchor, poi["point"])
        graphic = HPacker(children=[
            symbol("golf", 10),
            TextArea(str(poi["number"]), textprops={"fontsize": 6.5, "fontweight": "bold"}),
            TextArea(f"{distance / 1000:.1f} km", textprops={"fontsize": 6.5, "color": "#174b68"}),
        ], align="center", pad=0, sep=3)
        graphic.set_figure(fig)
        if graphic.get_window_extent(renderer).width > measured.width:
            raise ValueError(f"Golf distance label exceeds its reserved width: {poi['name']}")
        annotation = AnnotationBbox(graphic, label_point, xycoords="data", frameon=True,
                                    bboxprops={"facecolor": "white", "edgecolor": "#b7c1c3",
                                               "linewidth": 0.4, "alpha": 0.94},
                                    pad=0.15, zorder=10)
        ax.add_artist(annotation)
        arrow = ax.annotate("", xy=tip, xytext=anchor,
                            arrowprops={"arrowstyle": "-|>", "color": "#174b68", "lw": 1,
                                        "shrinkA": 0, "shrinkB": 0},
                            zorder=10)
        occupied.append(bbox)
        placed.append({"poi": poi, "anchor": anchor, "direction": direction,
                       "distance": distance, "bbox": bbox, "annotation": annotation, "arrow": arrow})
    return placed


def draw_pois(ax, pois, obstacles, station_centers):
    """Displace crowded symbols minimally; short leaders preserve their actual positions."""
    fig = ax.figure
    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    pixels_per_point = fig.dpi / 72
    canvas = ax.get_window_extent(renderer)
    occupied = list(obstacles)
    for x, y in station_centers:
        px, py = ax.transData.transform((x, y))
        occupied.append(Bbox.from_extents(px - 3, py - 3, px + 3, py + 3))
    offsets = [(0, 0)]
    for radius in range(4, 61, 4):
        offsets.extend((radius * math.cos(angle), radius * math.sin(angle))
                       for angle in [2 * math.pi * i / 16 for i in range(16)])
    shifted = 0
    def placement_order(poi):
        if poi["category"] == "high-speed station":
            return (0, poi["number"])
        if poi.get("identity") in {"relation/3676813", "way/96936293"}:
            return (1, poi["number"])
        return (2, poi["number"])

    for poi in sorted(pois, key=placement_order):
        x, y = ax.transData.transform(poi["point"])
        size = 15 if poi["category"] == "high-speed station" else 10
        graphic = HPacker(children=[
            symbol(poi["category"], size),
            TextArea(str(poi["number"]), textprops={
                "fontsize": 6.5, "fontweight": "bold", "color": "#202020",
                "bbox": {"facecolor": "white", "edgecolor": "none", "alpha": 0.9, "pad": 0.5},
            }),
        ], align="center", pad=0, sep=1)
        graphic.set_figure(fig)
        measured = graphic.get_window_extent(renderer)
        half_width = measured.width / 2 + 2 * pixels_per_point
        half_height = measured.height / 2 + 2 * pixels_per_point
        for dx, dy in offsets:
            px, py = x + dx * pixels_per_point, y + dy * pixels_per_point
            bbox = Bbox.from_extents(px - half_width, py - half_height,
                                     px + half_width, py + half_height)
            if (canvas.contains(bbox.x0, bbox.y0) and canvas.contains(bbox.x1, bbox.y1)
                    and not any(bbox.overlaps(other) for other in occupied)):
                break
        else:
            raise RuntimeError(f"No non-overlapping symbol position for {poi['name']}")
        occupied.append(bbox)
        if dx or dy:
            shifted += 1
            end = ax.transData.inverted().transform((px, py))
            ax.plot([poi["point"][0], end[0]], [poi["point"][1], end[1]],
                    color="#545a57", linewidth=0.5, zorder=8)
        ax.add_artist(AnnotationBbox(graphic, poi["point"],
                                     xybox=(dx, dy), xycoords="data", boxcoords="offset points",
                                     frameon=False, pad=0, zorder=9))
    return shifted


def annotate_legend_pois(pois, routes, stations, districts):
    """Classify original POI sites against station zones, then district boundaries."""
    colors = {route["properties"]["lineCode"]: route["properties"]["color"] for route in routes}
    station_points = [(station, project(*station["geometry"]["coordinates"][:2]))
                      for station in stations]
    district_geometries = []
    for district in districts:
        geom = transform(TRANSFORMER.transform, shape(district["geometry"]))
        if not geom.is_valid:
            geom = geom.buffer(0)
        district_geometries.append((district["properties"]["name"], geom))
    result = []
    for poi in pois:
        point = poi.get("reference_point", poi["point"])
        nearest = min(station_points, key=lambda item: (
            math.dist(point, item[1]), item[0]["properties"]["stationCode"]))
        station, station_point = nearest
        if math.dist(point, station_point) <= RADIUS_METERS:
            props = station["properties"]
            lines = [line for line in props["lineCodes"] if line in colors]
            if not lines:
                raise ValueError(f"No included line for station {props['name']}")
            label, color = props["name"], colors[lines[0]]
        else:
            matches = sorted(name for name, geom in district_geometries if geom.covers(Point(*point)))
            if not matches:
                raise ValueError(f"No district for POI {poi['name']}")
            label, color = matches[0].removesuffix(" District"), "#202020"
        result.append({**poi, "legend_location": label, "legend_color": color})
    return result


def legend_page(pois, routes, stations, districts):
    pois = annotate_legend_pois(pois, routes, stations, districts)
    fig = plt.figure(figsize=(297 / 25.4, 420 / 25.4))
    fig.text(0.06, 0.96, "POINTS OF INTEREST", fontsize=18, fontweight="bold", va="top")
    fig.text(0.06, 0.925, "Numbers identify map symbols. Short lines connect shifted symbols to their locations.",
             fontsize=9, color="#555555")
    fig.text(0.06, 0.908, "In brackets: the nearest MTR station in its line colour if inside a hiding zone; otherwise, the district in black.",
             fontsize=9, color="#555555")
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_axis_off()
    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    from matplotlib.font_manager import FontProperties
    font = FontProperties(size=7.5)
    column_width = 0.425
    width_pixels = (column_width - 0.035) * fig.bbox.width
    line_height = 11 / (fig.get_figheight() * 72)
    gap = 7 / (fig.get_figheight() * 72)
    tops = [0.90, 0.90]
    for category, (label, _) in POI_CATEGORIES.items():
        entries = [poi for poi in pois if poi["category"] == category]
        lines = []
        for poi in entries:
            prefix = f"{poi['number']}. "
            name = re.sub(r"\s*\(approximate[^)]*\)", "", poi["name"], flags=re.IGNORECASE)
            current = [(prefix, "#202020")]
            for text, color in ((name, "#202020"), (f"({poi['legend_location']})", poi["legend_color"])):
                for word in text.split():
                    spacer = "" if current[-1][0].endswith(" ") else " "
                    candidate = spacer + word
                    width = sum(renderer.get_text_width_height_descent(run, font, False)[0] for run, _ in current)
                    if width + renderer.get_text_width_height_descent(candidate, font, False)[0] > width_pixels:
                        if current == [(prefix, "#202020")]:
                            raise ValueError(f"Legend word too wide: {word}")
                        lines.append(current)
                        current = [("    ", "#202020")]
                        candidate = word
                    if current[-1][1] == color:
                        current[-1] = (current[-1][0] + candidate, color)
                    else:
                        current.append((candidate, color))
            lines.append(current)
        if not lines:
            lines = [[("No locations added yet.", "#202020")]]
        height = (len(lines) + 2.2) * line_height
        col = 0 if tops[0] >= tops[1] else 1
        left, top = 0.055 + col * 0.465, tops[col]
        if top - height < 0.045:
            raise ValueError(f"POI legend does not fit on page: {label}")
        ax.add_patch(Rectangle((left, top - height), column_width, height, transform=ax.transAxes,
                               facecolor="none", edgecolor="#aeb5b0", linewidth=0.7))
        ax.add_artist(AnnotationBbox(symbol(category, 12), (left + 0.018, top - line_height),
                                     xycoords=ax.transAxes, frameon=False))
        ax.text(left + 0.035, top - line_height, label, transform=ax.transAxes,
                fontsize=9, fontweight="bold", va="center")
        for index, runs in enumerate(lines):
            x = left + 0.015
            for text, color in runs:
                ax.text(x, top - (2 + index) * line_height, text,
                        transform=ax.transAxes, fontsize=7.5, color=color, va="top")
                x += renderer.get_text_width_height_descent(text, font, False)[0] / fig.bbox.width
        tops[col] = top - height - gap
    return fig
