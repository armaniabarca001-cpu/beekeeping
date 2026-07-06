"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

export interface HivePin {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface ApiaryMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  hives: HivePin[];
  pendingPin?: { lat: number; lng: number } | null;
  onHiveClick?: (hiveId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

function dotIcon(background: string, border: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${background};border:2px solid ${border};width:20px;height:20px;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const hiveIcon = dotIcon("#FFD369", "#222831");
const pendingIcon = dotIcon("#393E46", "#EEEEEE");

function ClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: false });
  }, [map, lat, lng, zoom]);
  return null;
}

// Leaflet reads its container's size once at construction and only reacts to
// `window` resize events after that - it has no ResizeObserver of its own. In
// a flex layout populated by a dynamically-imported (ssr:false) component,
// the container isn't reliably at its final size at that exact moment, so the
// map can get stuck thinking it's 0x0. Watching the container directly and
// calling invalidateSize() fixes that regardless of why the first read was off.
function SizeFixer() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    map.invalidateSize();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export function ApiaryMap({ center, zoom = 19, hives, pendingPin, onHiveClick, onMapClick }: ApiaryMapProps) {
  // MapContainer's center/zoom are initial-mount-only in react-leaflet; all
  // subsequent position changes go through the imperative Recenter child.
  const [initial] = useState({ center, zoom });

  return (
    <MapContainer
      center={[initial.center.lat, initial.center.lng]}
      zoom={initial.zoom}
      maxZoom={20}
      className="absolute inset-0"
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics, and the GIS User Community"
        maxZoom={20}
        maxNativeZoom={19}
      />
      <ClickHandler onClick={onMapClick} />
      <Recenter lat={center.lat} lng={center.lng} zoom={zoom} />
      <SizeFixer />
      {hives.map((hive) => (
        <Marker
          key={hive.id}
          position={[hive.lat, hive.lng]}
          icon={hiveIcon}
          eventHandlers={{ click: () => onHiveClick?.(hive.id) }}
        />
      ))}
      {pendingPin && <Marker position={[pendingPin.lat, pendingPin.lng]} icon={pendingIcon} />}
    </MapContainer>
  );
}
