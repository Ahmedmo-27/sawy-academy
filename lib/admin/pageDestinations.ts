import type { NavLinkItem } from "@/lib/api/types";
import { DEFAULT_SITE_SETTINGS } from "@/lib/branding";

export interface PageDestination {
  label: string;
  value: string;
}

/** Home-page room anchors used by the floor-plan jump links. */
export const HOME_SECTION_DESTINATIONS: PageDestination[] = [
  { label: "Home — Portfolio", value: "#portfolio" },
  { label: "Home — Courses", value: "#courses" },
  { label: "Home — Products", value: "#products" },
  { label: "Home — Research", value: "#researches" },
  { label: "Home — Contact", value: "#contact" },
  { label: "Home — Philosophy", value: "#philosophy" },
];

const FALLBACK_PAGES: PageDestination[] = [
  { label: "Home", value: "/" },
  { label: "Portfolio", value: "/portfolio" },
  { label: "Courses", value: "/courses" },
  { label: "Products", value: "/products" },
  { label: "Researches", value: "/researches" },
  { label: "Services", value: "/services" },
  { label: "Contact", value: "/contact" },
];

function flattenNavItems(
  items: NavLinkItem[],
  prefix = ""
): PageDestination[] {
  const out: PageDestination[] = [];

  for (const item of items) {
    const label = prefix ? `${prefix} → ${item.label}` : item.label;
    if (item.href) {
      out.push({ label, value: item.href });
    }
    if (item.children?.length) {
      out.push(...flattenNavItems(item.children, item.label));
    }
  }

  return out;
}

/** Main public pages — prefers live nav settings when available. */
export function getMainPageDestinations(
  navItems?: NavLinkItem[]
): PageDestination[] {
  const fromNav = flattenNavItems(
    navItems?.length ? navItems : DEFAULT_SITE_SETTINGS.navigation.items
  );
  const seen = new Set<string>();
  const merged: PageDestination[] = [{ label: "Home", value: "/" }];

  for (const page of [...fromNav, ...FALLBACK_PAGES]) {
    if (!page.value || seen.has(page.value)) continue;
    seen.add(page.value);
    merged.push(page);
  }

  return merged;
}

export function getCtaDestinations(navItems?: NavLinkItem[]): PageDestination[] {
  return getMainPageDestinations(navItems);
}

export function getJumpLinkDestinations(
  navItems?: NavLinkItem[]
): PageDestination[] {
  const pages = getMainPageDestinations(navItems);
  const seen = new Set(pages.map((p) => p.value));
  const extras = HOME_SECTION_DESTINATIONS.filter((d) => !seen.has(d.value));
  return [...pages, ...extras];
}
