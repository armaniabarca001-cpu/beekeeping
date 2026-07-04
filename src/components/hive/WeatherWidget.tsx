"use client";

import { useEffect, useState } from "react";
import type { CurrentWeather } from "@/lib/weather";

export function WeatherWidget({ hiveId }: { hiveId: string }) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "unconfigured" } | { status: "ready"; weather: CurrentWeather }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/hives/${hiveId}/weather`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.configured || !data.weather) setState({ status: "unconfigured" });
        else setState({ status: "ready", weather: data.weather });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unconfigured" });
      });
    return () => {
      cancelled = true;
    };
  }, [hiveId]);

  if (state.status === "loading") return null;

  if (state.status === "unconfigured") {
    return (
      <span className="text-xs text-slate-400" title="Set OPENWEATHER_API_KEY to enable this">
        Weather not configured
      </span>
    );
  }

  const { wind, humidity, temp } = state.weather;
  return (
    <span className="text-xs text-slate-300">
      {Math.round(temp)}°F · {Math.round(humidity)}% humidity · {Math.round(wind)} mph wind
    </span>
  );
}
