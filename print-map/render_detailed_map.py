"""Render an A3 railway game map from local, openly licensed data extracts."""

import argparse
import io
import zipfile
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import shapefile
from adjustText import adjust_text
from matplotlib.collections import LineCollection, PolyCollection
from matplotlib.patches import Circle, PathPatch
from matplotlib.path import Path as PlotPath
from pyproj import Transformer
from shapely.geometry import Point, box, shape
from shapely.geometry.polygon import orient
from shapely.ops import unary_union

from render_map import OUTPUT, PAPER_HEIGHT_MM, PAPER_WIDTH_MM, RADIUS_METERS, load_data, project


TRANSFORMER = Transformer.from_crs("EPSG:4326", "EPSG:32650", always_xy=True)
OSM_PREFIX = "gis_osm_{}_free_1"
OSM_LAYERS = {
    "landuse_a": {
        "forest": "#e1ead7", "park": "#d9e9d1", "grass": "#e7eedf",
        "recreation_ground": "#e1ebd8", "farmland": "#eeeede",
        "scrub": "#e6ebdf", "residential": "#f0efeb",
        "industrial": "#edeae7", "commercial": "#f1ede9",
    },
    "water_a": {
        "water": "#cfdfeb", "reservoir": "#cfdfeb", "riverbank": "#cfdfeb",
        "dock": "#cfdfeb", "wetland": "#dae8e4", "wetland_marsh": "#dae8e4",
        "wetland_mangrove": "#dae8e4", "wetland_tidalflat": "#dae8e4",
    },
}
ROAD_STYLES = {
    "motorway": ("#d5a77e", 0.48),
    "trunk": ("#d5a77e", 0.48),
    "primary": ("#dfbda0", 0.42),
    "secondary": ("#e0cbbc", 0.34),
    "tertiary": ("#ded9ce", 0.27),
    "unclassified": ("#e2ded5", 0.20),
    "residential": ("#e2ded5", 0.20),
}
for road_type in ("motorway", "trunk", "primary", "secondary", "tertiary"):
    ROAD_STYLES[road_type + "_link"] = ROAD_STYLES[road_type]


def reader_from_zip(archive, name):
    return shapefile.Reader(
        shp=io.BytesIO(archive.read(name + ".shp")),
        shx=io.BytesIO(archive.read(name + ".shx")),
        dbf=io.BytesIO(archive.read(name + ".dbf")),
        encoding="utf-8",
        encodingErrors="replace",
    )


def pieces(shp):
    indices = list(shp.parts) + [len(shp.points)]
    return [shp.points[indices[i]:indices[i + 1]] for i in range(len(indices) - 1)]


def projected_points(points):
    lon, lat = zip(*[(point[0], point[1]) for point in points])
    x, y = TRANSFORMER.transform(lon, lat)
    return np.column_stack((x, y))


def intersects_bounds(bounds, area):
    return not (
        bounds[2] < area[0] or bounds[0] > area[2]
        or bounds[3] < area[1] or bounds[1] > area[3]
    )


def network_bounds(routes, stations):
    points = [project(*station["geometry"]["coordinates"][:2]) for station in stations]
    points.extend(
        project(*point[:2])
        for route in routes
        for line in route["geometry"]["coordinates"]
        for point in line
    )
    padding = 2700
    return (
        min(p[0] for p in points) - padding, max(p[0] for p in points) + padding,
        min(p[1] for p in points) - padding, max(p[1] for p in points) + padding,
    )


def geographic_bounds(limits):
    inverse = Transformer.from_crs("EPSG:32650", "EPSG:4326", always_xy=True)
    xmin, xmax, ymin, ymax = limits
    corners = [inverse.transform(x, y) for x in (xmin, xmax) for y in (ymin, ymax)]
    return (
        min(p[0] for p in corners) - 0.01, min(p[1] for p in corners) - 0.01,
        max(p[0] for p in corners) + 0.01, max(p[1] for p in corners) + 0.01,
    )


def draw_land(ax, zip_path, area):
    with zipfile.ZipFile(zip_path) as archive:
        reader = reader_from_zip(archive, "ne_10m_land")
        polygons = []
        for item in reader.iterShapes():
            if intersects_bounds(item.bbox, area):
                clipped = shape(item.__geo_interface__).intersection(box(*area))
                geometries = getattr(clipped, "geoms", [clipped])
                for geom in geometries:
                    if geom.geom_type == "Polygon" and not geom.is_empty:
                        polygons.append(projected_points(geom.exterior.coords))
        ax.add_collection(PolyCollection(polygons, facecolor="#f5f4ed", edgecolor="none", zorder=0))


def draw_osm_background(ax, zip_path, area):
    counts = {}
    with zipfile.ZipFile(zip_path) as archive:
        for layer, styles in OSM_LAYERS.items():
            reader = reader_from_zip(archive, OSM_PREFIX.format(layer))
            groups = {name: [] for name in styles}
            for item in reader.iterShapeRecords():
                feature_type = item.record["fclass"]
                if feature_type not in styles or not intersects_bounds(item.shape.bbox, area):
                    continue
                groups[feature_type].extend(
                    projected_points(part) for part in pieces(item.shape) if len(part) >= 3
                )
            zorder = 0.6 if layer == "water_a" else 0.3
            for feature_type, polygons in groups.items():
                ax.add_collection(PolyCollection(
                    polygons, facecolor=styles[feature_type], edgecolor="none", zorder=zorder,
                    rasterized=True,
                ))
            counts[layer] = sum(map(len, groups.values()))
        reader = reader_from_zip(archive, OSM_PREFIX.format("roads"))
        groups = {name: [] for name in ROAD_STYLES}
        for item in reader.iterShapeRecords():
            feature_type = item.record["fclass"]
            if feature_type not in groups or not intersects_bounds(item.shape.bbox, area):
                continue
            groups[feature_type].extend(
                projected_points(part) for part in pieces(item.shape) if len(part) >= 2
            )
        for feature_type, lines in groups.items():
            color, width = ROAD_STYLES[feature_type]
            ax.add_collection(LineCollection(
                lines, colors=color, linewidths=width, zorder=0.8, rasterized=True,
            ))
        counts["roads"] = sum(map(len, groups.values()))
        reader = reader_from_zip(archive, OSM_PREFIX.format("waterways"))
        lines = []
        for item in reader.iterShapeRecords():
            if item.record["fclass"] in {"river", "canal"} and intersects_bounds(item.shape.bbox, area):
                lines.extend(projected_points(part) for part in pieces(item.shape) if len(part) >= 2)
        ax.add_collection(LineCollection(lines, colors="#bed4e0", linewidths=0.35,
                                         zorder=0.9, rasterized=True))
        counts["waterways"] = len(lines)
    return counts


def visible_districts(districts, area):
    visible = []
    for district in sorted(districts, key=lambda item: item["properties"]["name"]):
        geom = shape(district["geometry"])
        if not geom.is_valid:
            geom = geom.buffer(0)
        clipped = geom.intersection(box(*area))
        if not clipped.is_empty and clipped.area > 0.00001:
            marker = clipped.representative_point()
            visible.append((district, project(marker.x, marker.y)))
    return visible


def label_overlap_count(texts, renderer):
    bboxes = [text.get_window_extent(renderer).expanded(1.02, 1.08) for text in texts]
    return sum(a.overlaps(b) for i, a in enumerate(bboxes) for b in bboxes[i + 1:])


def separate_labels(texts, renderer, ax, obstacles=()):
    bounds = ax.get_window_extent(renderer)
    inverse = ax.transData.inverted()
    for _ in range(len(texts)):
        boxes = [text.get_window_extent(renderer).expanded(1.02, 1.08) for text in texts]
        conflicts = [
            sum(current.overlaps(other) for j, other in enumerate(boxes) if i != j)
            + sum(current.overlaps(obstacle) for obstacle in obstacles)
            for i, current in enumerate(boxes)
        ]
        if not any(conflicts):
            return
        index = max(range(len(texts)), key=lambda i: conflicts[i])
        current = boxes[index]
        offsets = [
            (dx, dy)
            for dx in range(-180, 181, 5)
            for dy in range(-180, 181, 5)
            if dx or dy
        ]
        offsets.sort(key=lambda offset: offset[0] ** 2 + offset[1] ** 2)
        for dx, dy in offsets:
            candidate = current.translated(dx, dy)
            if (candidate.x0 < bounds.x0 or candidate.x1 > bounds.x1
                    or candidate.y0 < bounds.y0 or candidate.y1 > bounds.y1):
                continue
            if any(candidate.overlaps(other) for j, other in enumerate(boxes) if j != index):
                continue
            if any(candidate.overlaps(obstacle) for obstacle in obstacles):
                continue
            pixel_pos = ax.transData.transform(texts[index].get_position())
            texts[index].set_position(inverse.transform(pixel_pos + (dx, dy)))
            break
        else:
            raise RuntimeError(f"No non-overlapping label position for {texts[index].get_text()}.")
    raise RuntimeError("Unable to separate all station labels.")


def render(osm_zip, land_zip):
    routes, stations, districts = load_data()
    limits = network_bounds(routes, stations)
    area = geographic_bounds(limits)
    centers = [project(*station["geometry"]["coordinates"][:2]) for station in stations]
    visible = visible_districts(districts, area)

    fig = plt.figure(figsize=(PAPER_WIDTH_MM / 25.4, PAPER_HEIGHT_MM / 25.4))
    fig.patch.set_facecolor("white")
    ax = fig.add_axes([0.018, 0.052, 0.82, 0.93])
    ax.set_facecolor("#d9e8ef")
    ax.set_aspect("equal", adjustable="box")
    ax.set_xlim(limits[0], limits[1])
    ax.set_ylim(limits[2], limits[3])
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)

    draw_land(ax, land_zip, area)
    counts = draw_osm_background(ax, osm_zip, area)

    # Construct the union once so overlaps are not brightened repeatedly.
    zones = unary_union([Point(x, y).buffer(RADIUS_METERS, resolution=32) for x, y in centers])
    zone_parts = getattr(zones, "geoms", [zones])
    for part in zone_parts:
        part = orient(part, sign=1)
        paths = [PlotPath(np.asarray(ring.coords)) for ring in [part.exterior, *part.interiors]]
        ax.add_patch(PathPatch(PlotPath.make_compound_path(*paths), facecolor="white",
                               edgecolor="none", alpha=0.27, zorder=1.1))

    district_lines = [
        projected_points(ring)
        for district in districts
        for polygon in district["geometry"]["coordinates"]
        for ring in polygon
    ]
    ax.add_collection(LineCollection(district_lines, colors="#6a6d6a", linewidths=0.55,
                                     linestyles=(0, (3, 2)), alpha=0.8, zorder=2))
    for x, y in centers:
        ax.add_patch(Circle((x, y), RADIUS_METERS, fill=False, edgecolor="#748979",
                            linewidth=0.42, linestyle=(0, (2.5, 2.5)), alpha=0.8, zorder=3))
    for route in routes:
        lines = [projected_points(line) for line in route["geometry"]["coordinates"]]
        ax.add_collection(LineCollection(lines, colors=route["properties"]["color"], linewidths=1.4,
                                         capstyle="round", zorder=4))
    ax.scatter([x for x, _ in centers], [y for _, y in centers], s=10, facecolors="white",
               edgecolors="#282c28", linewidths=0.55, zorder=5)

    for index, (_, (x, y)) in enumerate(visible, start=1):
        ax.text(x, y, str(index), fontsize=6, fontweight="bold", color="#595d58",
                ha="center", va="center", zorder=6,
                bbox={"boxstyle": "circle,pad=0.18", "facecolor": "white",
                      "edgecolor": "#999d98", "alpha": 0.92, "linewidth": 0.4})

    labels = [
        ax.text(x, y, station["properties"]["name"], fontsize=6.3,
                color="#1e2523", ha="left", va="center", zorder=7,
                bbox={"boxstyle": "square,pad=0.06", "facecolor": "white",
                      "edgecolor": "none", "alpha": 0.8})
        for station, (x, y) in zip(stations, centers)
    ]
    fig.canvas.draw()
    np.random.seed(18)
    adjust_text(labels, x=[x for x, _ in centers], y=[y for _, y in centers], ax=ax,
                target_x=[x for x, _ in centers], target_y=[y for _, y in centers],
                force_text=(0.45, 0.65), force_static=(0.15, 0.25),
                force_pull=(0.012, 0.012), expand=(1.1, 1.3), max_move=(7, 7),
                time_lim=25)
    fig.canvas.draw()
    separate_labels(labels, fig.canvas.get_renderer(), ax)
    overlaps = label_overlap_count(labels, fig.canvas.get_renderer())
    print(f"Station label bounding-box overlaps: {overlaps}")
    inverse = ax.transData.inverted()
    for text, center in zip(labels, centers):
        bounds = text.get_window_extent(fig.canvas.get_renderer())
        point = ax.transData.transform(center)
        edge = np.array([np.clip(point[0], bounds.x0, bounds.x1),
                         np.clip(point[1], bounds.y0, bounds.y1)])
        if np.linalg.norm(point - edge) > 5:
            end = inverse.transform(edge)
            ax.plot([center[0], end[0]], [center[1], end[1]], color="#777b75",
                    linewidth=0.35, alpha=0.75, zorder=6)

    legend = fig.add_axes([0.85, 0.12, 0.14, 0.75])
    legend.axis("off")
    legend.text(0, 1, "DISTRICTS", fontsize=8, fontweight="bold", va="top", color="#454b46")
    for index, (district, _) in enumerate(visible, start=1):
        name = district["properties"]["name"].removesuffix(" District")
        legend.text(0, 0.95 - (index - 1) * 0.045, f"{index:>2}  {name}",
                    fontsize=6.7, va="top", color="#454b46")

    xmin, xmax, ymin, ymax = limits
    scale_x = xmax - 7000
    scale_y = ymin + 1200
    ax.plot([scale_x, scale_x + 5000], [scale_y, scale_y], color="#343733",
            linewidth=1.1, solid_capstyle="butt", zorder=8)
    for x in (scale_x, scale_x + 2500, scale_x + 5000):
        ax.plot([x, x], [scale_y - 150, scale_y + 150], color="#343733", linewidth=0.8, zorder=8)
    for x, label in ((scale_x, "0"), (scale_x + 5000, "5 km")):
        ax.text(x, scale_y - 250, label, ha="center", va="top", fontsize=6, zorder=8,
                bbox={"boxstyle": "square,pad=0.04", "facecolor": "white",
                      "edgecolor": "none", "alpha": 0.8})

    fig.text(0.025, 0.018, "© OpenStreetMap contributors | https://www.openstreetmap.org/copyright | "
             "Land: Natural Earth (public domain)", fontsize=5.5, color="#555b56")
    pdf = OUTPUT / "hong-kong-game-map-a3-detailed.pdf"
    png = OUTPUT / "hong-kong-game-map-detailed-preview.png"
    fig.savefig(pdf, dpi=250, facecolor="white", metadata={
        "Title": "Hong Kong railway game map - A3 detailed draft",
        "Creator": "OpenStreetMap and Natural Earth; project print-map renderer",
    })
    fig.savefig(png, dpi=150, facecolor="white")
    plt.close(fig)
    print(f"Rendered {len(routes)} lines, {len(stations)} stations and {len(visible)} visible districts.")
    print(f"Background features: {counts}")
    print(f"PDF: {pdf}")
    print(f"Preview: {png}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--osm-zip", type=Path, required=True, help="Geofabrik Hong Kong shapefile ZIP")
    parser.add_argument("--land-zip", type=Path, required=True, help="Natural Earth 10m land ZIP")
    args = parser.parse_args()
    render(args.osm_zip, args.land_zip)
