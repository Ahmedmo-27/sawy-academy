"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { registerGsap } from "@/lib/gsap/config";
import { scheduleScrollRefresh } from "@/lib/gsap/refresh";
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
    scheduleScrollRefresh(120);
  }, [pathname]);

  return (
    <SmoothScrollProvider>
      <StableViewport />
      <BlueprintGridLayer />
      <FloatingGeometryLayer />
      <ScrollProgressScale />
      <div className="relative z-10 flex min-h-[var(--app-height)] flex-col">
        {children}
      </div>
    </SmoothScrollProvider>
  );
}
