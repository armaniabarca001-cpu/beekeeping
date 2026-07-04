"use client";

import { useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMapsLibrary,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";

export interface HivePin {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface ApiaryMapProps {
  address: string;
  hives: HivePin[];
  pendingPin?: { lat: number; lng: number } | null;
  onHiveClick?: (hiveId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onCenterResolved?: (center: { lat: number; lng: number }) => void;
}

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 }; // continental US fallback

function AddressGeocoder({
  address,
  onResolved,
}: {
  address: string;
  onResolved: (center: { lat: number; lng: number }) => void;
}) {
  const geocodingLib = useMapsLibrary("geocoding");

  useEffect(() => {
    if (!geocodingLib || !address) return;
    const geocoder = new geocodingLib.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const loc = results[0].geometry.location;
        onResolved({ lat: loc.lat(), lng: loc.lng() });
      }
    });
  }, [geocodingLib, address, onResolved]);

  return null;
}

export function ApiaryMap({
  address,
  hives,
  pendingPin,
  onHiveClick,
  onMapClick,
  onCenterResolved,
}: ApiaryMapProps) {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

  function handleResolved(newCenter: { lat: number; lng: number }) {
    setCenter(newCenter);
    onCenterResolved?.(newCenter);
  }

  return (
    <APIProvider apiKey={apiKey}>
      <AddressGeocoder address={address} onResolved={handleResolved} />
      <Map
        mapId={mapId}
        center={center}
        defaultZoom={19}
        mapTypeId="satellite"
        tilt={0}
        gestureHandling="greedy"
        onClick={(e: MapMouseEvent) => {
          const latLng = e.detail.latLng;
          if (latLng) onMapClick?.(latLng.lat, latLng.lng);
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {hives.map((hive) => (
          <AdvancedMarker
            key={hive.id}
            position={{ lat: hive.lat, lng: hive.lng }}
            title={hive.name}
            onClick={() => onHiveClick?.(hive.id)}
          >
            <Pin background="#FFD369" borderColor="#222831" glyphColor="#222831" />
          </AdvancedMarker>
        ))}
        {pendingPin && (
          <AdvancedMarker position={pendingPin}>
            <Pin background="#393E46" borderColor="#EEEEEE" glyphColor="#EEEEEE" />
          </AdvancedMarker>
        )}
      </Map>
    </APIProvider>
  );
}
