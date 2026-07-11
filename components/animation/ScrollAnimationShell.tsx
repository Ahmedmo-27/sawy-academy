"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { BlueprintGridLayer } from "./BlueprintGridLayer";
import { FloatingGeometryLayer } from "./FloatingGeometryLayer";
import { ScrollProgressScale } from "./ScrollProgressScale";

interface ScrollAnimationShellProps {
  children: React.ReactNode;
}

export function ScrollAnimationShell({ children }: ScrollAnimationShellProps) {
  const pathname = usePathname();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    registerGsap();
    const t = setTimeout(() => ScrollTrigger.refresh(), 100);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      {isDesktop && <BlueprintGridLayer />}
      {isDesktop && <FloatingGeometryLayer />}
      <ScrollProgressScale />
      <div className="relative z-10">{children}</div>
    </>
  );
}
