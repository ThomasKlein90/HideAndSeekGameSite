"use client";

import {
  Circle,
  CircleMarker,
  FeatureGroup,
  GeoJSON,
  LayersControl,
  MapContainer,
  TileLayer,
  Tooltip,
  ZoomControl,
} from "react-leaflet";
import { mtrLines, mtrRouteFeatures } from "@/data/mtr-reference";

const hongKongCenter: [number, number] = [22.3193, 114.1694];

export function HongKongMap() {
  return (
    <section className="map-section" aria-labelledby="hong-kong-map-heading">
      <div className="map-section-heading">
        <div>
          <p className="eyebrow">Hong Kong game map</p>
          <h2 id="hong-kong-map-heading">Explore the playable city.</h2>
        </div>
        <span className="map-status">MTR preview live</span>
      </div>
      <p className="map-description">
        Pan and zoom the OpenStreetMap base layer, or toggle the simplified MTR
        reference overlay. Route geometry is for planning display and still
        needs source validation before it is used for gameplay.
      </p>
      <div className="interactive-map-shell">
        <MapContainer
          center={hongKongCenter}
          className="interactive-map"
          scrollWheelZoom
          zoom={11}
          zoomControl={false}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="OpenStreetMap">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.Overlay checked name="MTR reference overlay">
              <GeoJSON
                data={mtrRouteFeatures}
                style={(feature) => ({
                  color: feature?.properties?.color ?? "#3e765e",
                  weight: 4,
                  opacity: 0.9,
                })}
              />
            </LayersControl.Overlay>
            <LayersControl.Overlay checked name="MTR stations and labels">
              <FeatureGroup>
                {mtrLines.flatMap((mtrLine) =>
                  mtrLine.stations.map((station) => (
                    <CircleMarker
                      center={[station.coordinates[1], station.coordinates[0]]}
                      key={`${mtrLine.id}-${station.name}`}
                      pathOptions={{
                        color: mtrLine.color,
                        fillColor: "#ffffff",
                        fillOpacity: 1,
                        weight: 2,
                      }}
                      radius={5}
                    >
                      <Tooltip>{station.name}</Tooltip>
                    </CircleMarker>
                  )),
                )}
              </FeatureGroup>
            </LayersControl.Overlay>
          </LayersControl>
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
        <span>
          <i className="legend-swatch legend-swatch-mtr" /> MTR reference routes
        </span>
        <span className="map-legend-pending">
          MTR geometry requires source validation before gameplay use
        </span>
      </div>
    </section>
  );
}
