"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getTheme, THEME_STORAGE_KEY } from "@/lib/themes/registry";
import {
  isThemeId,
  type ThemeDefinition,
  type ThemeId,
} from "@/lib/themes/types";

interface ThemeContextValue {
  theme: ThemeDefinition;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: getTheme("atelier"),
  themeId: "atelier",
  setThemeId: () => {},
});

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "atelier";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(stored)) return stored;
  } catch {
    /* private mode */
  }
  const fromDom = document.documentElement.dataset.theme;
  return isThemeId(fromDom) ? fromDom : "atelier";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>("atelier");

  useEffect(() => {
    const next = readStoredTheme();
    setThemeIdState(next);
    document.documentElement.dataset.theme = next;
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    document.documentElement.dataset.theme = id;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: getTheme(themeId),
      themeId,
      setThemeId,
    }),
    [themeId, setThemeId]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
