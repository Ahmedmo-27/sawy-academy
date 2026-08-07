import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let registered = false;

export function registerGsap(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  // Mobile browser chrome (URL / tab bars) expands & collapses on scroll,
  // changing innerHeight. Refreshing ScrollTrigger on those vertical-only
  // resizes causes pinned sections and scroll progress to jump.
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

export function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger, SplitText };
