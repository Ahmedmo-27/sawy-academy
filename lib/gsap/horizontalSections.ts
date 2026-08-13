import { ScrollTrigger } from "@/lib/gsap/config";
import { getLenis } from "@/lib/smoothScroll";
import {
  SCROLL_AXIS_ATTR,
  SCROLL_AXIS_X,
  isHorizontalScrollTrigger,
} from "@/lib/gsap/scrollAxis";

export { SCROLL_AXIS_ATTR, SCROLL_AXIS_X };

const ID_PREFIX = "horizontal-";
let sequence = 0;

/** Create a unique ScrollTrigger id for a horizontal pin section. */
export function createHorizontalScrollId(label = "bay"): string {
  sequence += 1;
  return `${ID_PREFIX}${label}-${sequence}`;
}

export function isHorizontalScrollId(id: string | undefined): boolean {
  return Boolean(id?.startsWith(ID_PREFIX));
}

export function getScrollY(): number {
  const lenis = getLenis();
  if (lenis) return lenis.scroll;
  return window.scrollY || document.documentElement.scrollTop || 0;
}

export function getMaxScroll(): number {
  const doc = document.documentElement;
  return Math.max(0, doc.scrollHeight - doc.clientHeight);
}

export type HorizontalSectionState = {
  active: boolean;
  /** 0–1 progress through the active horizontal pin. */
  progress: number;
  /** Scale progress to hold while the section is active. */
  freezeAt: number;
  /** Absolute scroll position where the section begins. */
  start: number;
};

/**
 * Resolve whether the page scroll is currently inside any horizontal pin
 * range. Prefers ScrollTriggers tagged with a horizontal id or data-scroll-axis.
 */
export function getHorizontalSectionState(
  scrollY = getScrollY()
): HorizontalSectionState {
  const maxScroll = getMaxScroll();
  let active: HorizontalSectionState | null = null;

  for (const st of ScrollTrigger.getAll()) {
    const id = st.vars?.id as string | undefined;
    const tagged =
      isHorizontalScrollId(id) || isHorizontalScrollTrigger(st.trigger);
    if (!tagged) continue;

    const start = Number(st.start);
    const end = Number(st.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      continue;
    }

    if (scrollY < start || scrollY > end) continue;

    const span = end - start;
    const progress = Math.min(1, Math.max(0, (scrollY - start) / span));
    const freezeAt =
      maxScroll > 0 ? Math.min(1, Math.max(0, start / maxScroll)) : 0;

    // If two overlap, keep the one that started first (earlier on the page).
    if (!active || start < active.start) {
      active = { active: true, progress, freezeAt, start };
    }
  }

  return active ?? { active: false, progress: 0, freezeAt: 0, start: 0 };
}
