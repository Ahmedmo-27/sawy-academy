import type Lenis from "lenis";

let instance: Lenis | null = null;

export function setLenisInstance(lenis: Lenis | null): void {
  instance = lenis;
}

export function getLenis(): Lenis | null {
  return instance;
}

/** Prefer Lenis when active so ScrollTrigger / UI stay in sync. */
export function scrollToY(y: number, immediate = true): void {
  const lenis = instance;
  if (lenis) {
    lenis.scrollTo(y, { immediate });
    return;
  }
  window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
}
