/** Parse display prices like "EGP 42,000" into a numeric amount. */
export function parsePrice(price: string): number {
  const digits = price.replace(/[^\d.]/g, "");
  const value = Number(digits);
  return Number.isFinite(value) ? value : 0;
}

/** Format a numeric amount using the site's existing "EGP …" display pattern. */
export function formatPrice(amount: number): string {
  return `EGP ${Math.round(amount).toLocaleString("en-US")}`;
}
