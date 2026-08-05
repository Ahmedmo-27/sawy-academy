"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { logger } from "@/lib/logger";

function pageLabel(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/courses")) return "courses";
  if (pathname.startsWith("/portfolio")) return "portfolio";
  if (pathname.startsWith("/shop") || pathname.startsWith("/products")) {
    return "shop";
  }
  if (pathname.startsWith("/researches") || pathname.startsWith("/research")) {
    return "research";
  }
  if (pathname.startsWith("/services")) return "services";
  if (pathname.startsWith("/contact")) return "contact";
  if (pathname.startsWith("/auth") || pathname.startsWith("/login")) {
    return "auth";
  }
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/cart") || pathname.startsWith("/checkout")) {
    return "cart";
  }
  return pathname.split("/").filter(Boolean)[0] ?? "unknown";
}

export function RouteLogger() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const search = searchParams.toString();
    const route = search ? `${pathname}?${search}` : pathname;
    const from = previousPathRef.current;

    logger.info("Route navigation", {
      page: pageLabel(pathname),
      route,
      pathname,
      search: search || undefined,
      from: from ?? undefined,
      referrer:
        typeof document !== "undefined" ? document.referrer || undefined : undefined,
    });

    previousPathRef.current = route;
  }, [pathname, searchParams]);

  return null;
}
