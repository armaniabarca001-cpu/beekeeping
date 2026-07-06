export const BACKGROUND_THEMES = ["garden", "space", "clouds", "sunset", "underwater"] as const;
export type BackgroundTheme = (typeof BACKGROUND_THEMES)[number];

export const BACKGROUND_THEME_LABELS: Record<BackgroundTheme, string> = {
  garden: "Garden",
  space: "Space",
  clouds: "Clouds",
  sunset: "Sunset",
  underwater: "Underwater",
};

export function isBackgroundTheme(value: string): value is BackgroundTheme {
  return (BACKGROUND_THEMES as readonly string[]).includes(value);
}
