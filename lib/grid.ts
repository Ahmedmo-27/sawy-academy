/** 8px modular grid — all spacing derives from this unit */
export const MODULE = 8;

/** Progressive content width — full bleed on phones, capped on larger viewports */
export const SITE_MAX =
  "max-w-full sm:max-w-[36rem] md:max-w-[48rem] lg:max-w-[64rem] xl:max-w-[72rem] 2xl:max-w-[90rem]";

/**
 * Horizontal gutter scales with viewport.
 * Uses the 8px modular scale: px-2=16px, px-3=24px, px-4=32px, …
 * Avoid px-4 on phones — with this scale it is 32px/side and starves content.
 */
export const GUTTER = "px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6";

/** Shared shell for nav + page containers */
export const SITE_SHELL = `mx-auto w-full min-w-0 ${SITE_MAX} ${GUTTER}`;

/** 12-column bay grid used across portfolio, products, and course layouts */
export const BAY_GRID =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-px bg-hairline";

export const BAY_CELL = "bg-concrete";
