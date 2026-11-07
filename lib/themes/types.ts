export const THEME_IDS = [
  "atelier",
  "obsidian",
  "corten",
  "instrument",
  "ledger",
  "lecture",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeLayout =
  | "bar"
  | "rail"
  | "masthead"
  | "instrument"
  | "folio"
  | "quiet";

export type ThemeReveal = "rise" | "wipe" | "hard" | "orbit" | "clip";

export interface ThemeMotion {
  ease: string;
  /** Base travel in pixels for transform aliases. */
  travel: number;
  duration: number;
  scaleFrom: number;
  reveal: ThemeReveal;
  stagger: number;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  note: string;
  layout: ThemeLayout;
  motion: ThemeMotion;
}

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}
