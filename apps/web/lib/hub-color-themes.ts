/**
 * Preset accent color themes for hubs.
 * Admins choose one of these to brand their hub.
 */

export type HubColorThemeKey = "teal" | "blue" | "purple" | "coral" | "gold" | "slate";

export interface HubColorTheme {
  key: HubColorThemeKey;
  label: string;
  /** Main accent used for buttons, links, active states */
  primary: string;
  /** Darker shade for hover/pressed states */
  primaryHover: string;
  /** Light background tint for cards, tags, badges */
  surface: string;
  /** Very light wash for page-level backgrounds */
  wash: string;
  /** Tailwind-friendly swatch color shown in the palette picker */
  swatch: string;
}

export const HUB_COLOR_THEMES: HubColorTheme[] = [
  {
    key: "teal",
    label: "Teal",
    primary: "#0C5C57",
    primaryHover: "#094a46",
    surface: "#EAF6F3",
    wash: "#F6FBFA",
    swatch: "#0C5C57",
  },
  {
    key: "blue",
    label: "Ocean Blue",
    primary: "#1D4ED8",
    primaryHover: "#1E40AF",
    surface: "#EFF6FF",
    wash: "#F8FAFF",
    swatch: "#1D4ED8",
  },
  {
    key: "purple",
    label: "Royal Purple",
    primary: "#7C3AED",
    primaryHover: "#6D28D9",
    surface: "#F5F3FF",
    wash: "#FAF9FF",
    swatch: "#7C3AED",
  },
  {
    key: "coral",
    label: "Warm Coral",
    primary: "#DC4E41",
    primaryHover: "#C4382C",
    surface: "#FEF2F2",
    wash: "#FFFAFA",
    swatch: "#DC4E41",
  },
  {
    key: "gold",
    label: "Golden Amber",
    primary: "#B45309",
    primaryHover: "#92400E",
    surface: "#FFFBEB",
    wash: "#FFFEF5",
    swatch: "#B45309",
  },
  {
    key: "slate",
    label: "Classic Slate",
    primary: "#475569",
    primaryHover: "#334155",
    surface: "#F1F5F9",
    wash: "#F8FAFC",
    swatch: "#475569",
  },
];

const THEME_MAP = new Map(HUB_COLOR_THEMES.map((t) => [t.key, t]));

/** Default theme (teal) — matches the existing brand. */
export const DEFAULT_HUB_THEME = HUB_COLOR_THEMES[0]!;

/** Look up a theme by key, falling back to the default teal theme. */
export function getHubColorTheme(key?: string | null): HubColorTheme {
  if (!key) return DEFAULT_HUB_THEME;
  return THEME_MAP.get(key as HubColorThemeKey) ?? DEFAULT_HUB_THEME;
}
