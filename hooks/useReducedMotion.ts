"use client";

import { useSyncExternalStore } from "react";
import {
  REDUCED_MOTION_QUERY,
  prefersReducedMotion,
} from "@/lib/motion";

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
