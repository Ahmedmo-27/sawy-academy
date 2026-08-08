import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { prefersReducedMotion } from "@/lib/motion";

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
  return prefersReducedMotion();
}

export { gsap, ScrollTrigger, SplitText };
