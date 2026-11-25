"""Render the focused, portrait A3 game-map draft alongside the wider draft."""

import argparse
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from adjustText import adjust_text
from matplotlib.collections import LineCollection
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Circle, PathPatch, Rectangle
from matplotlib.path import Path as PlotPath
from shapely.geometry import LineString, Point, box, shape
from shapely.geometry.polygon import orient
from shapely.ops import transform, unary_union

from render_detailed_map import (
    TRANSFORMER,
    draw_land,
    draw_osm_background,
    geographic_bounds,
    label_overlap_count,
    projected_points,
    separate_labels,
)
from render_map import OUTPUT, PAPER_HEIGHT_MM, PAPER_WIDTH_MM, RADIUS_METERS, ROOT, load_data, project
from poi_map import airport_indicator, draw_off_map_golf, draw_pois, legend_page, load_pois


EDGE_MARGIN_METERS = 1000
LEGEND_FRACTIONS = (0.012, 0.015, 0.16, 0.16)
SCALE_MARKS_METERS = (0, 250, 500, 1000, 2500, 5000)
OUTSIDE_DIM_OPACITY = 0.12
LANDMASS_NAMES = ("Hong Kong Island", "Kowloon", "Tsing Yi", "Ap Lei Chau")
HIGH_SPEED_COLOR = "#49345f"


def load_high_speed_lines():
    with (ROOT / "public" / "data" / "hong-kong-high-speed-rail.geojson").open(encoding="utf-8") as file:
        data = json.load(file)
    if len(data["features"]) != 1 or data["features"][0]["geometry"]["type"] != "MultiLineString":
        raise ValueError("Expected one high-speed railway MultiLineString.")
    return [projected_points(line) for line in data["features"][0]["geometry"]["coordinates"]]


def draw_high_speed_rail(ax, lines):
    collection = LineCollection(lines, colors=HIGH_SPEED_COLOR, linewidths=1.15,
                                linestyles=(0, (3, 2)), capstyle="round", zorder=4.2)
    ax.add_collection(collection)
    return collection


def draw_high_speed_label(ax):
    return ax.text(0.13, 0.70, "High Speed Train Line", transform=ax.transAxes,
                   fontsize=7, color=HIGH_SPEED_COLOR, ha="center", va="center",
                   rotation=-50, rotation_mode="anchor", zorder=9,
                   bbox={"boxstyle": "square,pad=0.25", "facecolor": "white",
                         "edgecolor": "#b7adc0", "linewidth": 0.5, "alpha": 0.92})


def load_landmass_points():
    points = {}
    for filename in ("hong-kong-islands.geojson", "hong-kong-named-places.geojson"):
        with (ROOT / "public" / "data" / filename).open(encoding="utf-8") as file:
            data = json.load(file)
        for feature in data["features"]:
            name = feature["properties"]["name"]
            if name in LANDMASS_NAMES:
                if name in points:
                    raise ValueError(f"Duplicate landmass label: {name}")
                points[name] = project(*feature["geometry"]["coordinates"][:2])
    if set(points) != set(LANDMASS_NAMES):
        raise ValueError(f"Missing landmass labels: {set(LANDMASS_NAMES) - set(points)}")
    return points


def draw_landmass_labels(ax, points):
    labels = []
    xmin, xmax = ax.get_xlim()
    ymin, ymax = ax.get_ylim()
    for name in LANDMASS_NAMES:
        x, y = points[name]
        if name == "Kowloon":
            x, y = xmax - 0.02 * (xmax - xmin), ymax - 0.02 * (ymax - ymin)
        elif name == "Ap Lei Chau":
            y = ymin + 175
        labels.append(ax.text(
            x + (150 if name == "Tsing Yi" else 0), y, name,
            fontsize=8, fontweight="bold", fontstyle="italic", color="#455d58",
            ha="left" if name == "Tsing Yi" else "right" if name == "Kowloon" else "center",
            va="center", zorder=6.5,
            bbox={"boxstyle": "round,pad=0.16", "facecolor": "white",
                  "edgecolor": "none", "alpha": 0.72},
        ))
    return labels


def focused_bounds(stations):
    centers = {
        station["properties"]["stationCode"]: project(*station["geometry"]["coordinates"][:2])
        for station in stations
    }
    return (
        centers["TSY"][0] - EDGE_MARGIN_METERS,
        centers["LHP"][0] + EDGE_MARGIN_METERS,
        centers["SOH"][1] - EDGE_MARGIN_METERS,
        centers["TWO"][1] + EDGE_MARGIN_METERS,
    )


def focused_stations(stations, bounds):
    xmin, xmax, ymin, ymax = bounds
    return [
        station for station in stations
        if (xmin <= project(*station["geometry"]["coordinates"][:2])[0] <= xmax
            and ymin <= project(*station["geometry"]["coordinates"][:2])[1] <= ymax)
    ]


def legend_bounds(bounds):
    xmin, xmax, ymin, ymax = bounds
    x0, y0, x1, y1 = LEGEND_FRACTIONS
    return (
        xmin + x0 * (xmax - xmin), ymin + y0 * (ymax - ymin),
        xmin + x1 * (xmax - xmin), ymin + y1 * (ymax - ymin),
    )


def assert_legend_clear(routes, stations, bounds):
    legend_area = box(*legend_bounds(bounds))
    for station in stations:
        x, y = project(*station["geometry"]["coordinates"][:2])
        if legend_area.intersects(Point(x, y).buffer(RADIUS_METERS)):
            raise ValueError(f"District legend covers the {station['properties']['name']} hiding zone.")
    for route in routes:
        for line in route["geometry"]["coordinates"]:
            if legend_area.intersects(LineString(projected_points(line))):
                raise ValueError(f"District legend covers the {route['properties']['name']} route.")


def focused_districts(districts, bounds):
    xmin, xmax, ymin, ymax = bounds
    map_area = box(xmin, ymin, xmax, ymax)
    legend_area = box(*legend_bounds(bounds)).buffer(100)
    visible = []
    for district in sorted(districts, key=lambda item: item["properties"]["name"]):
        geom = transform(TRANSFORMER.transform, shape(district["geometry"]))
        if not geom.is_valid:
            geom = geom.buffer(0)
        clipped = geom.intersection(map_area)
        if clipped.is_empty or clipped.area < 1000:
            continue
        placeable = clipped.difference(legend_area)
        if placeable.is_empty:
            raise ValueError(f"No visible marker position for {district['properties']['name']}.")
        point = placeable.representative_point()
        visible.append((district, (point.x, point.y)))
    return visible


def outside_zone_mask(centers, bounds):
    xmin, xmax, ymin, ymax = bounds
    zones = unary_union([Point(x, y).buffer(RADIUS_METERS, resolution=48) for x, y in centers])
    return box(xmin, ymin, xmax, ymax).difference(zones)


def draw_graduated_scale(ax, x, y):
    """Draw a linearly graduated bar at the map's actual scale."""
    ax.add_patch(Rectangle((x - 300, y - 300), 5600, 800,
                           facecolor="white", edgecolor="#a6aba6",
                           linewidth=0.4, alpha=0.92, zorder=8))
    for index, (start, end) in enumerate(zip(SCALE_MARKS_METERS, SCALE_MARKS_METERS[1:])):
        ax.add_patch(Rectangle((x + start, y), end - start, 110,
                               facecolor="#303633" if index % 2 == 0 else "white",
                               edgecolor="#303633", linewidth=0.55, zorder=9))
    for distance, label in zip(SCALE_MARKS_METERS, ("0", "250", "500 m", "1 km", "2.5 km", "5 km")):
        above = distance in (250, 1000)
        ax.text(x + distance, y + 160 if above else y - 70, label,
                ha="center", va="bottom" if above else "top",
                fontsize=6.2, color="#232a26", zorder=9)


def fit_district_legend(ax, patch, texts):
    """Fit the visible key to its widest line with a small right padding."""
    ax.figure.canvas.draw()
    renderer = ax.figure.canvas.get_renderer()
    right = max(text.get_window_extent(renderer).x1 for text in texts)
    right += renderer.points_to_pixels(4)
    left = ax.transData.transform((patch.get_x(), patch.get_y()))[0]
    new_right = ax.transData.inverted().transform((right, 0))[0]
    if right <= left or new_right > patch.get_x() + patch.get_width():
        raise ValueError("District legend text does not fit the reserved area.")
    patch.set_width(new_right - patch.get_x())


def render(osm_zip, land_zip, landmass_labels=False, pois=False):
    routes, stations, districts = load_data()
    bounds = focused_bounds(stations)
    included = focused_stations(stations, bounds)
    centers = [project(*station["geometry"]["coordinates"][:2]) for station in included]
    visible = focused_districts(districts, bounds)
    assert_legend_clear(routes, stations, bounds)
    area = geographic_bounds(bounds)
    xmin, xmax, ymin, ymax = bounds

    fig = plt.figure(figsize=(PAPER_HEIGHT_MM / 25.4, PAPER_WIDTH_MM / 25.4))
    fig.patch.set_facecolor("white")
    ax = fig.add_axes([0.025, 0.026, 0.95, 0.95])
    ax.set_facecolor("#d9e8ef")
    ax.set_aspect("equal", adjustable="box")
    ax.set_xlim(xmin, xmax)
    ax.set_ylim(ymin, ymax)
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)

    draw_land(ax, land_zip, area)
    background_counts = draw_osm_background(ax, osm_zip, area)

    mask = outside_zone_mask(centers, bounds)
    for part in getattr(mask, "geoms", [mask]):
        part = orient(part, sign=1)
        paths = [PlotPath(np.asarray(ring.coords)) for ring in [part.exterior, *part.interiors]]
        ax.add_patch(PathPatch(PlotPath.make_compound_path(*paths), facecolor="#626963",
                               edgecolor="none", alpha=OUTSIDE_DIM_OPACITY, zorder=1.1))

    district_lines = [
        projected_points(ring)
        for district in districts
        for polygon in district["geometry"]["coordinates"]
        for ring in polygon
    ]
    ax.add_collection(LineCollection(district_lines, colors="#6a6d6a", linewidths=0.65,
                                     linestyles=(0, (3, 2)), alpha=0.8, zorder=2))
    for x, y in centers:
        ax.add_patch(Circle((x, y), RADIUS_METERS, fill=False, edgecolor="#748979",
                            linewidth=0.5, linestyle=(0, (2.5, 2.5)), alpha=0.85, zorder=3))
    for route in routes:
        lines = [projected_points(line) for line in route["geometry"]["coordinates"]]
        ax.add_collection(LineCollection(lines, colors=route["properties"]["color"], linewidths=1.65,
                                         capstyle="round", zorder=4))
    if pois:
        draw_high_speed_rail(ax, load_high_speed_lines())
    ax.scatter([x for x, _ in centers], [y for _, y in centers], s=13, facecolors="white",
               edgecolors="#282c28", linewidths=0.65, zorder=5)

    for index, (_, (x, y)) in enumerate(visible, start=1):
        ax.text(x, y, str(index), fontsize=7, fontweight="bold", color="#595d58",
                ha="center", va="center", zorder=6,
                bbox={"boxstyle": "circle,pad=0.2", "facecolor": "white",
                      "edgecolor": "#999d98", "alpha": 0.95, "linewidth": 0.4})

    lx0, ly0, lx1, ly1 = legend_bounds(bounds)
    legend_patch = Rectangle((lx0, ly0), lx1 - lx0, ly1 - ly0, facecolor="white",
                             edgecolor="#afb5b0", linewidth=0.6, alpha=0.95, zorder=8)
    ax.add_patch(legend_patch)
    legend_x = lx0 + (lx1 - lx0) * 0.055
    district_key_texts = [ax.text(legend_x, ly1 - (ly1 - ly0) * 0.06, "DISTRICTS", fontsize=8,
                                  fontweight="bold", va="top", color="#454b46", zorder=9)]
    step = (ly1 - ly0) * 0.86 / len(visible)
    for index, (district, _) in enumerate(visible, start=1):
        name = district["properties"]["name"].removesuffix(" District")
        district_key_texts.append(ax.text(
            legend_x, ly1 - (ly1 - ly0) * 0.12 - (index - 1) * step,
            f"{index:>2}  {name}", fontsize=7, va="top", color="#454b46", zorder=9))
    fit_district_legend(ax, legend_patch, district_key_texts)

    heading = ax.text(
        0.018, 0.985, "HIDE + SEEK\nHONG KONG",
        transform=ax.transAxes, ha="left", va="top",
        fontsize=11, fontweight="bold", color="#303a34", linespacing=1.2, zorder=9,
        bbox={"boxstyle": "square,pad=0.4", "facecolor": "white",
              "edgecolor": "#afb5b0", "linewidth": 0.6, "alpha": 0.94},
    )
    fig.canvas.draw()
    heading_bbox = heading.get_bbox_patch().get_window_extent(fig.canvas.get_renderer())
    heading_data = heading_bbox.transformed(ax.transData.inverted())
    heading_area = box(heading_data.x0, heading_data.y0, heading_data.x1, heading_data.y1)
    if any(heading_area.intersects(Point(x, y).buffer(RADIUS_METERS)) for x, y in centers):
        raise ValueError("The heading covers a station hiding zone.")
    if any(
        heading_area.intersects(LineString(projected_points(line)))
        for route in routes for line in route["geometry"]["coordinates"]
    ):
        raise ValueError("The heading covers a railway route.")

    place_labels = draw_landmass_labels(ax, load_landmass_points()) if landmass_labels else []
    rail_label = draw_high_speed_label(ax) if pois else None
    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    place_boxes = [label.get_window_extent(renderer).expanded(1.05, 1.1) for label in place_labels]
    rail_boxes = [rail_label.get_window_extent(renderer).expanded(1.1, 1.2)] if rail_label else []
    obstacles = [legend_patch.get_window_extent(renderer), heading.get_bbox_patch().get_window_extent(renderer)]
    for index, place_box in enumerate(place_boxes):
        if not ax.get_window_extent(renderer).contains(*place_box.get_points()[0]) or not ax.get_window_extent(renderer).contains(*place_box.get_points()[1]):
            raise ValueError(f"Landmass label outside the map: {LANDMASS_NAMES[index]}")
        if any(place_box.overlaps(other) for other in obstacles + place_boxes[:index]):
            raise ValueError(f"Landmass label overlaps a map label or legend: {LANDMASS_NAMES[index]}")
        if LANDMASS_NAMES[index] == "Ap Lei Chau":
            label_data = place_box.transformed(ax.transData.inverted())
            area = box(label_data.x0, label_data.y0, label_data.x1, label_data.y1)
            if any(area.intersects(Point(x, y).buffer(RADIUS_METERS)) for x, y in centers):
                raise ValueError("The Ap Lei Chau label overlaps a hiding zone.")

    airport_obstacles = []
    if pois:
        with (ROOT / "public" / "data" / "hong-kong-named-places.geojson").open(encoding="utf-8") as file:
            places = json.load(file)["features"]
        airports = [feature for feature in places if feature["properties"]["category"] == "airport"]
        if len(airports) != 1:
            raise ValueError("Expected exactly one airport reference point.")
        _, distance, azimuth = airport_indicator(ax, airports[0]["geometry"]["coordinates"][:2], airport_obstacles)
        print(f"Airport indicator: {distance / 1000:.1f} km straight-line, bearing {azimuth:.1f} degrees.")

    labels = [
        ax.text(x, y, station["properties"]["name"], fontsize=7.1,
                color="#1e2523", ha="left", va="center", zorder=7,
                bbox={"boxstyle": "square,pad=0.06", "facecolor": "white",
                      "edgecolor": "none", "alpha": 0.82})
        for station, (x, y) in zip(included, centers)
    ]
    fig.canvas.draw()
    np.random.seed(18)
    adjust_text(labels, x=[x for x, _ in centers], y=[y for _, y in centers],
                objects=[legend_patch, heading.get_bbox_patch(), *place_labels,
                         *([rail_label] if rail_label else [])], ax=ax,
                target_x=[x for x, _ in centers], target_y=[y for _, y in centers],
                force_text=(0.45, 0.65), force_static=(0.15, 0.25),
                force_pull=(0.012, 0.012), expand=(1.1, 1.3), max_move=(7, 7),
                time_lim=30)
    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    separate_labels(labels, renderer, ax, obstacles=[
        legend_patch.get_window_extent(renderer),
        heading.get_bbox_patch().get_window_extent(renderer),
        *place_boxes,
        *rail_boxes,
        *airport_obstacles,
    ])
    overlaps = label_overlap_count(labels, renderer)
    if overlaps:
        raise RuntimeError(f"{overlaps} station labels still overlap.")
    print(f"Station label bounding-box overlaps: {overlaps}")
    inverse = ax.transData.inverted()
    for text, center in zip(labels, centers):
        label_box = text.get_window_extent(renderer)
        point = ax.transData.transform(center)
        edge = np.array([np.clip(point[0], label_box.x0, label_box.x1),
                         np.clip(point[1], label_box.y0, label_box.y1)])
        if np.linalg.norm(point - edge) > 5:
            end = inverse.transform(edge)
            ax.plot([center[0], end[0]], [center[1], end[1]], color="#777b75",
                    linewidth=0.4, alpha=0.75, zorder=6)

    draw_graduated_scale(ax, xmax - 5800, ymin + 600)
    if pois:
        fig.canvas.draw()
        renderer = fig.canvas.get_renderer()
        obstacles = [
            legend_patch.get_window_extent(renderer),
            heading.get_bbox_patch().get_window_extent(renderer),
            *place_boxes,
            *rail_boxes,
            *airport_obstacles,
            *[label.get_window_extent(renderer).expanded(1.05, 1.1) for label in labels],
            *[text.get_window_extent(renderer).expanded(1.05, 1.1)
              for text in ax.texts if text.get_text().isdigit()],
            ax.patches[-6].get_window_extent(renderer),
        ]
        poi_records = load_pois(bounds)
        edge_golf = [poi for poi in poi_records if poi.get("off_map")]
        edge_markers = draw_off_map_golf(ax, edge_golf, obstacles, centers)
        shifted = draw_pois(ax, [poi for poi in poi_records if not poi.get("off_map")],
                            obstacles + [marker["bbox"] for marker in edge_markers], centers)
        for marker in edge_markers:
            print(f"Golf {marker['poi']['number']}: {marker['distance'] / 1000:.1f} km from edge.")
        print(f"POIs: {len(poi_records)}; displaced with leaders: {shifted}.")

    fig.text(0.026, 0.012, "© OpenStreetMap contributors | https://www.openstreetmap.org/copyright"
             " | Land: Natural Earth (public domain)", fontsize=5.5, color="#555b56")
    suffix = "-poi-station-legend" if pois else "-landmasses-v2" if landmass_labels else ""
    pdf = OUTPUT / f"hong-kong-game-map-a3-focused{suffix}.pdf"
    png = OUTPUT / f"hong-kong-game-map-focused{suffix}-preview.png"
    metadata = {
        "Title": "Hong Kong railway game map - focused A3 draft",
        "Creator": "OpenStreetMap and Natural Earth; project print-map renderer",
    }
    if pois:
        with PdfPages(pdf, metadata=metadata) as pages:
            pages.savefig(fig, dpi=350, facecolor="white")
            back = legend_page(poi_records, routes, stations, districts)
            pages.savefig(back, dpi=350, facecolor="white")
            plt.close(back)
    else:
        fig.savefig(pdf, dpi=350, facecolor="white", metadata=metadata)
    if not pois:
        fig.savefig(png, dpi=160, facecolor="white")
    plt.close(fig)
    print(f"Rendered {len(included)} complete station zones, {len(visible)} visible districts.")
    print(f"Background features: {background_counts}")
    print(f"PDF: {pdf}")
    if not pois:
        print(f"Preview: {png}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--osm-zip", type=Path, required=True, help="Geofabrik Hong Kong shapefile ZIP")
    parser.add_argument("--land-zip", type=Path, required=True, help="Natural Earth 10m land ZIP")
    parser.add_argument("--landmass-labels", action="store_true", help="Render a separate draft with landmass names")
    parser.add_argument("--pois", action="store_true", help="Render a separate two-page POI draft")
    args = parser.parse_args()
    render(args.osm_zip, args.land_zip, landmass_labels=args.landmass_labels, pois=args.pois)
