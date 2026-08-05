"use client";

import { Suspense } from "react";
import { RouteLogger } from "@/components/logging/RouteLogger";

export function PlatformLogger() {
  return (
    <Suspense fallback={null}>
      <RouteLogger />
    </Suspense>
  );
}
