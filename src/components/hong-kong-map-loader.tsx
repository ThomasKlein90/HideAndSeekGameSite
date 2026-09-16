"use client";

import dynamic from "next/dynamic";

const HongKongMap = dynamic(
  () => import("@/components/hong-kong-map").then((module) => module.HongKongMap),
  {
    ssr: false,
    loading: () => (
      <section className="map-section" aria-label="Loading Hong Kong map">
        <p className="eyebrow">Hong Kong game map</p>
        <p className="map-description">Loading the interactive map...</p>
      </section>
    ),
  },
);

export function HongKongMapLoader() {
  return <HongKongMap />;
}
