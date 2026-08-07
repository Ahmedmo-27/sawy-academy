"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { SmoothScrollProvider } from "./SmoothScrollProvider";
import { StableViewport } from "./StableViewport";
import { BlueprintGridLayer } from "./BlueprintGridLayer";
import { FloatingGeometryLayer } from "./FloatingGeometryLayer";
import { ScrollProgressScale } from "./ScrollProgressScale";

interface ScrollAnimationShellProps {
  children: React.ReactNode;
}

export function ScrollAnimationShell({ children }: ScrollAnimationShellProps) {
  const pathname = usePathname();

  useEffect(() => {
    registerGsap();
    const t = setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <SmoothScrollProvider>
      <StableViewport />
      <BlueprintGridLayer />
      <FloatingGeometryLayer />
      <ScrollProgressScale />
      <div className="relative z-10">{children}</div>
    </SmoothScrollProvider>
  );
}
