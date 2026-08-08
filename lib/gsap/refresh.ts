import { ScrollTrigger, registerGsap } from "@/lib/gsap/config";

let refreshTimer: number | null = null;
let refreshFrame = 0;
let refreshInProgress = false;

/**
 * Coalesces layout-triggered refresh requests into one measurement pass.
 * The double animation frame lets pending DOM and style changes settle first.
 */
export function scheduleScrollRefresh(delay = 80) {
  if (typeof window === "undefined") return;
  // ScrollTrigger temporarily adds/removes pin spacers while refreshing.
  // Ignore observer callbacks caused by that internal DOM work or they create
  // an endless refresh loop that makes Lenis scrolling feel uneven.
  if (refreshInProgress) return;

  if (refreshTimer) window.clearTimeout(refreshTimer);
  if (refreshFrame) window.cancelAnimationFrame(refreshFrame);

  refreshTimer = window.setTimeout(() => {
    refreshTimer = null;
    refreshFrame = window.requestAnimationFrame(() => {
      refreshFrame = window.requestAnimationFrame(() => {
        refreshFrame = 0;

        if (refreshInProgress) {
          scheduleScrollRefresh();
          return;
        }

        registerGsap();
        refreshInProgress = true;
        ScrollTrigger.refresh();
        window.requestAnimationFrame(() => {
          refreshInProgress = false;
        });
      });
    });
  }, delay);
}
