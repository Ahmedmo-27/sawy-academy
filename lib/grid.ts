/** 8px modular grid — all spacing derives from this unit */
export const MODULE = 8;

/**
 * Progressive content width — full bleed on phones, capped on larger viewports.
 * Keep in sync with `--site-max` in app/globals.css (used for gutter accents).
 * xl/2xl stay wide enough that chrome and pin galleries don't feel zoomed-in.
 */
export const SITE_MAX =
  "max-w-full sm:max-w-[36rem] md:max-w-[48rem] lg:max-w-[64rem] xl:max-w-[80rem] 2xl:max-w-[96rem]";

/** Nav spans further than page content so the header doesn't sit in a tight island */
export const NAV_MAX =
  "max-w-full xl:max-w-[90rem] 2xl:max-w-[112rem]";

/** Fixed accents that sit just outside the content column on wide screens */
export const SITE_GUTTER_LEFT =
  "left-[max(0.5rem,calc((100vw-var(--site-max))/2-1.5rem))]";
export const SITE_GUTTER_RIGHT =
  "right-[max(0.5rem,calc((100vw-var(--site-max))/2-2rem))]";
export const SITE_GUTTER_RAIL =
  "left-[max(0.75rem,calc((100vw-var(--site-max))/2-2.25rem))]";

/**
 * Horizontal gutter scales with viewport.
 * Uses the 8px modular scale: px-3=24px, px-4=32px, px-5=40px, …
 * Phone gutters stay at 24px so content isn't squeezed against the edges.
 */
export const GUTTER = "px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 2xl:px-10";

/** Shared shell for page containers */
export const SITE_SHELL = `mx-auto w-full min-w-0 ${SITE_MAX} ${GUTTER}`;

/** Shared shell for primary nav — wider than content on large screens */
export const NAV_SHELL = `mx-auto w-full min-w-0 ${NAV_MAX} ${GUTTER}`;

/** Horizontal pin card width — smaller peek on xl+ so the set feels roomier */
export const PIN_CARD =
  "w-[min(88vw,22rem)] shrink-0 sm:w-[min(38vw,24rem)] xl:w-[min(26vw,20rem)] 2xl:w-[min(22vw,18rem)]";

/** 12-column bay grid used across portfolio, products, and course layouts */
export const BAY_GRID =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-px bg-hairline";

export const BAY_CELL = "bg-concrete";
