import type { ThemeDefinition, ThemeId } from "@/lib/themes/types";

export const THEME_STORAGE_KEY = "sawy-theme";

/**
 * Each theme is a design language: layout, type, chrome, and motion.
 * Color tokens live in app/theme-languages.css under html[data-theme].
 * Atelier keeps the existing stylesheet and is the hydration default.
 */
export const themes: Record<ThemeId, ThemeDefinition> = {
  atelier: {
    id: "atelier",
    name: "Atelier",
    note: "Swiss sheet, hairline grid, serif display",
    layout: "bar",
    motion: {
      ease: "power3.out",
      travel: 32,
      duration: 0.8,
      scaleFrom: 0.95,
      reveal: "rise",
      stagger: 0.08,
    },
  },
  obsidian: {
    id: "obsidian",
    name: "Obsidian Edition",
    note: "Dark editorial magazine, italic folio, image wipes",
    layout: "rail",
    motion: {
      ease: "power2.out",
      travel: 48,
      duration: 1.05,
      scaleFrom: 1.04,
      reveal: "wipe",
      stagger: 0.12,
    },
  },
  corten: {
    id: "corten",
    name: "Corten Yard",
    note: "Brutalist board, stamped index, hard cuts",
    layout: "masthead",
    motion: {
      ease: "power4.out",
      travel: 16,
      duration: 0.38,
      scaleFrom: 1,
      reveal: "hard",
      stagger: 0.04,
    },
  },
  instrument: {
    id: "instrument",
    name: "Instrument",
    note: "Field notes, measured rings, slow orbital motion",
    layout: "instrument",
    motion: {
      ease: "sine.out",
      travel: 18,
      duration: 1.15,
      scaleFrom: 0.92,
      reveal: "orbit",
      stagger: 0.1,
    },
  },
  ledger: {
    id: "ledger",
    name: "Ledger",
    note: "Newspaper columns, folio rules, clip reveals",
    layout: "folio",
    motion: {
      ease: "power2.inOut",
      travel: 0,
      duration: 0.9,
      scaleFrom: 1,
      reveal: "clip",
      stagger: 0.06,
    },
  },
  lecture: {
    id: "lecture",
    name: "Lecture",
    note: "Cinematic chapters, quiet chrome, scrubbed pins",
    layout: "quiet",
    motion: {
      ease: "power3.inOut",
      travel: 64,
      duration: 1.2,
      scaleFrom: 1.08,
      reveal: "wipe",
      stagger: 0.14,
    },
  },
  arabesque: {
    id: "arabesque",
    name: "Arabesque",
    note: "Islamic geometry, pointed arch, brass and green frieze",
    layout: "iwan",
    motion: {
      ease: "sine.inOut",
      travel: 0,
      duration: 1.05,
      scaleFrom: 0.84,
      reveal: "star",
      stagger: 0.09,
    },
  },
  pharaonic: {
    id: "pharaonic",
    name: "Pharaonic",
    note: "Temple pylon, limestone relief, lapis and gold",
    layout: "pylon",
    motion: {
      ease: "power1.inOut",
      travel: 0,
      duration: 1.25,
      scaleFrom: 1,
      reveal: "relief",
      stagger: 0.11,
    },
  },
};

export const themeList: ThemeDefinition[] = [
  themes.atelier,
  themes.obsidian,
  themes.corten,
  themes.instrument,
  themes.ledger,
  themes.lecture,
  themes.arabesque,
  themes.pharaonic,
];

export function getTheme(id: ThemeId): ThemeDefinition {
  return themes[id];
}
