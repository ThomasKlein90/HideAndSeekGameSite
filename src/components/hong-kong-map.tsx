"use client";

import {
  Circle,
  MapContainer,
  TileLayer,
  ZoomControl,
} from "react-leaflet";

const hongKongCenter: [number, number] = [22.3193, 114.1694];

export function HongKongMap() {
  return (
    <section className="map-section" aria-labelledby="hong-kong-map-heading">
      <div className="map-section-heading">
        <div>
          <p className="eyebrow">Hong Kong game map</p>
          <h2 id="hong-kong-map-heading">Explore the playable city.</h2>
        </div>
        <span className="map-status">Base map live</span>
      </div>
      <p className="map-description">
        Pan and zoom the OpenStreetMap base layer. Transit and boundary layers
        will be added only after their data sources and licenses are documented.
      </p>
      <div className="interactive-map-shell">
        <MapContainer
          center={hongKongCenter}
          className="interactive-map"
          scrollWheelZoom
          zoom={11}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={hongKongCenter}
            pathOptions={{ color: "#3e765e", fillOpacity: 0.08 }}
            radius={500}
          />
          <ZoomControl position="bottomright" />
        </MapContainer>
      </div>
      <div className="map-legend" aria-label="Map layer legend">
        <span>
          <i className="legend-swatch legend-swatch-base" /> OpenStreetMap base
        </span>
        <span>
          <i className="legend-swatch legend-swatch-radius" /> Reference-radius
          preview
        </span>
        <span className="map-legend-pending">Transit layers pending source review</span>
      </div>
    </section>
  );
}
