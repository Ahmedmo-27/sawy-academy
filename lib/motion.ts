export const easeOut = [0.22, 1, 0.36, 1] as const;

export const viewportOnce = {
  once: true,
  margin: "-48px 0px -48px 0px",
} as const;

/** Hero entrance — slow, dramatic */
export const revealHero = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

/** Structural elements — headings, primary anchors */
export const revealStructural = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

/** Infill — metadata, captions, secondary copy */
export const revealInfill = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

/** Dense grids — quick functional reveal */
export const revealGrid = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export const fadeUp = revealStructural;

export const transitions = {
  hero: { duration: 1.1, ease: easeOut },
  structural: { duration: 0.8, ease: easeOut },
  infill: { duration: 0.55, ease: easeOut },
  grid: { duration: 0.45, ease: easeOut },
} as const;

export type RevealVariant = keyof typeof transitions;

export const revealTransition = (
  variant: RevealVariant = "structural",
  delay = 0
) => ({
  ...transitions[variant],
  delay,
});

export const hoverTransition = {
  duration: 0.55,
  ease: easeOut,
};

export const navTransition = {
  duration: 0.3,
  ease: easeOut,
};

export function parseLevelProgress(level: string): number {
  const match = level.match(/Level (\d+) \/ (\d+)/);
  if (!match) return 1;
  return parseInt(match[1], 10) / parseInt(match[2], 10);
}

export const parallax = {
  background: 0.25,
  midground: 0.45,
  foreground: 1,
} as const;
