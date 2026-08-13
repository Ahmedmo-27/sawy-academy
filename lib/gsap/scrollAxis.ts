/** Mark pin viewports whose scroll progress drives horizontal motion. */
export const SCROLL_AXIS_X = "x" as const;

export const SCROLL_AXIS_ATTR = "data-scroll-axis";

export function isHorizontalScrollTrigger(
  trigger: Element | string | null | undefined
): boolean {
  if (!trigger || typeof trigger === "string") return false;
  if (trigger.getAttribute(SCROLL_AXIS_ATTR) === SCROLL_AXIS_X) return true;
  return Boolean(trigger.closest(`[${SCROLL_AXIS_ATTR}="${SCROLL_AXIS_X}"]`));
}
