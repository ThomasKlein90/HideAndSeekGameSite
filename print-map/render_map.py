"""Render the existing Hong Kong map data as a minimal A3 print map."""

import json
import math
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from matplotlib.patches import Circle


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = Path(__file__).resolve().parent
MTR_FILE = ROOT / "public" / "data" / "mtr-osm.geojson"
DISTRICT_FILE = ROOT / "public" / "data" / "hong-kong-districts.geojson"

EXCLUDED_LINES = {"AEL"}
RADIUS_METERS = 500
PAPER_WIDTH_MM = 420
PAPER_HEIGHT_MM = 297


def project(longitude, latitude):
    """Project WGS84 coordinates into UTM zone 50N, in metres."""
    a = 6378137.0
    eccentricity_sq = 0.0066943799901413165
    scale = 0.9996
    lat = math.radians(latitude)
    lon_delta = math.radians(longitude - 117)
    sine = math.sin(lat)
    cosine = math.cos(lat)
    tangent_sq = math.tan(lat) ** 2
    second_eccentricity_sq = eccentricity_sq / (1 - eccentricity_sq)
    curvature = a / math.sqrt(1 - eccentricity_sq * sine**2)
    c = second_eccentricity_sq * cosine**2
    term = cosine * lon_delta
    e2, e3 = eccentricity_sq**2, eccentricity_sq**3
    meridian = a * (
        (1 - eccentricity_sq / 4 - 3 * e2 / 64 - 5 * e3 / 256) * lat
        - (3 * eccentricity_sq / 8 + 3 * e2 / 32 + 45 * e3 / 1024)
        * math.sin(2 * lat)
        + (15 * e2 / 256 + 45 * e3 / 1024) * math.sin(4 * lat)
        - 35 * e3 / 3072 * math.sin(6 * lat)
    )
    x = 500000 + scale * curvature * (
        term
        + (1 - tangent_sq + c) * term**3 / 6
        + (5 - 18 * tangent_sq + tangent_sq**2 + 72 * c - 58 * second_eccentricity_sq)
        * term**5
        / 120
    )
    y = scale * (
        meridian
        + curvature
        * math.tan(lat)
        * (
            term**2 / 2
            + (5 - tangent_sq + 9 * c + 4 * c**2) * term**4 / 24
            + (61 - 58 * tangent_sq + tangent_sq**2 + 600 * c - 330 * second_eccentricity_sq)
            * term**6
            / 720
        )
    )
    return x, y


def load_data():
    with MTR_FILE.open(encoding="utf-8") as file:
        mtr = json.load(file)
    with DISTRICT_FILE.open(encoding="utf-8") as file:
        districts = json.load(file)

    routes = [
        feature for feature in mtr["features"]
        if feature["properties"]["kind"] == "route"
        and feature["properties"]["lineCode"] not in EXCLUDED_LINES
    ]
    included = {route["properties"]["lineCode"] for route in routes}
    stations = [
        feature for feature in mtr["features"]
        if feature["properties"]["kind"] == "station"
        and included.intersection(feature["properties"]["lineCodes"])
    ]
    if len(routes) != 9 or len(stations) != 96 or len(districts["features"]) != 18:
        raise ValueError("Unexpected map coverage; inspect the source data before rendering.")
    return routes, stations, districts["features"]


def render():
    routes, stations, districts = load_data()
    district_lines = [
        [project(*point[:2]) for point in ring]
        for district in districts
        for polygon in district["geometry"]["coordinates"]
        for ring in polygon
    ]
    route_lines = [
        (route["properties"]["color"], [project(*point[:2]) for point in line])
        for route in routes
        for line in route["geometry"]["coordinates"]
    ]
    centers = [project(*station["geometry"]["coordinates"][:2]) for station in stations]
    all_points = [
        point
        for line in district_lines + [line for _, line in route_lines]
        for point in line
    ] + centers
    margin = 1800
    xmin = min(point[0] for point in all_points) - margin
    xmax = max(point[0] for point in all_points) + margin
    ymin = min(point[1] for point in all_points) - margin
    ymax = max(point[1] for point in all_points) + margin

    fig = plt.figure(figsize=(PAPER_WIDTH_MM / 25.4, PAPER_HEIGHT_MM / 25.4))
    fig.patch.set_facecolor("white")
    ax = fig.add_axes([0.025, 0.035, 0.95, 0.945])
    ax.set_facecolor("#edece5")
    ax.set_aspect("equal", adjustable="box")
    ax.set_xlim(xmin, xmax)
    ax.set_ylim(ymin, ymax)
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)

    for x, y in centers:
        ax.add_patch(Circle((x, y), RADIUS_METERS, facecolor="#faf9f2",
                            edgecolor="none", zorder=1))
    ax.add_collection(LineCollection(district_lines, colors="#9a9b91",
                                     linewidths=0.36, zorder=2))
    for x, y in centers:
        ax.add_patch(Circle((x, y), RADIUS_METERS, fill=False, edgecolor="#a4a79a",
                            linewidth=0.3, linestyle=(0, (2.5, 2.5)), zorder=3))
    for color, line in route_lines:
        ax.add_collection(LineCollection([line], colors=color, linewidths=1.05,
                                         capstyle="round", zorder=4))
    ax.scatter([x for x, _ in centers], [y for _, y in centers], s=5.5,
               facecolors="white", edgecolors="#292c29", linewidths=0.48, zorder=5)

    # Keep a true 5 km projected scale independent of the page's fit.
    scale_x = xmax - 7500
    scale_y = ymin + 2400
    ax.plot([scale_x, scale_x + 5000], [scale_y, scale_y], color="#343733",
            linewidth=1.0, solid_capstyle="butt", zorder=6)
    for x in (scale_x, scale_x + 2500, scale_x + 5000):
        ax.plot([x, x], [scale_y - 200, scale_y + 200], color="#343733",
                linewidth=0.8, zorder=6)
    ax.text(scale_x, scale_y - 350, "0", ha="center", va="top", fontsize=6, zorder=6)
    ax.text(scale_x + 5000, scale_y - 350, "5 km", ha="center", va="top",
            fontsize=6, zorder=6)

    fig.text(0.026, 0.015, "© OpenStreetMap contributors | ODbL 1.0",
             fontsize=5, color="#666862", ha="left", va="bottom")
    pdf = OUTPUT / "hong-kong-game-map-a3-draft.pdf"
    png = OUTPUT / "hong-kong-game-map-preview.png"
    fig.savefig(pdf, facecolor=fig.get_facecolor(), metadata={
        "Title": "Hong Kong game map - A3 draft",
        "Creator": "OpenStreetMap data; project print-map renderer",
    })
    fig.savefig(png, dpi=120, facecolor=fig.get_facecolor())
    plt.close(fig)
    print(f"Rendered {len(routes)} railway lines, {len(stations)} station centers, "
          f"and {len(districts)} districts.")
    print(f"PDF: {pdf}")
    print(f"Preview: {png}")


if __name__ == "__main__":
    render()
