"use client";

import { useEffect, useId, useRef, useState } from "react";
import { themeList } from "@/lib/themes/registry";
import { useTheme } from "@/lib/themes/ThemeProvider";
import type { ThemeId } from "@/lib/themes/types";

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { themeId, setThemeId } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = themeList.find((item) => item.id === themeId) ?? themeList[0];

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(id: ThemeId) {
    setThemeId(id);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${compact ? "" : "shrink-0"}`}>
      <button
        type="button"
        className="theme-switch inline-flex min-h-11 items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.14em]"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="theme-switch-mark" aria-hidden="true" />
        <span>{compact ? current.name : `Design · ${current.name}`}</span>
      </button>
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Design language"
          className="theme-switch-panel absolute right-0 z-[80] mt-2 w-[min(20rem,calc(100vw-2rem))] p-2"
        >
          {themeList.map((item) => {
            const selected = item.id === themeId;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={`theme-switch-option flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left ${
                  selected ? "is-selected" : ""
                }`}
                onClick={() => choose(item.id)}
              >
                <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em]">
                  {item.name}
                </span>
                <span className="text-[0.75rem] leading-snug opacity-75">
                  {item.note}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
