export interface CurrentWeather {
  wind: number;
  humidity: number;
  temp: number;
  pollen: number | null;
}

// Pollen source is an unresolved assumption (spec Section 2) - no provider
// wired up yet, so this always comes back null until one is chosen.
export async function getCurrentWeather(lat: number, lng: number): Promise<CurrentWeather | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("units", "imperial");
  url.searchParams.set("appid", apiKey);

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return null;

  const data = await res.json();
  return {
    wind: data.wind?.speed ?? null,
    humidity: data.main?.humidity ?? null,
    temp: data.main?.temp ?? null,
    pollen: null,
  };
}
