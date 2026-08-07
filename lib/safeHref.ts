const SAFE_ABSOLUTE = /^(https?:|mailto:)/i;

/**
 * Allowlist CMS/user-provided hrefs to block `javascript:` and other unsafe schemes.
 * Returns `fallback` when the value is missing or unsafe.
 */
export function safeHref(
  value: unknown,
  fallback = ""
): string {
  if (typeof value !== "string") return fallback;

  const href = value.trim();
  if (!href) return fallback;

  // Same-page section anchors (e.g. floor-plan jump links: #portfolio).
  if (href.startsWith("#")) {
    return href;
  }

  if (href.startsWith("/") && !href.startsWith("//")) {
    return href;
  }

  if (SAFE_ABSOLUTE.test(href)) {
    return href;
  }

  return fallback;
}
