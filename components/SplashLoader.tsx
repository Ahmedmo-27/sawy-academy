"use client";

import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";

export function SplashLoader() {
  // Keep the server and first client render identical. Reading document in the
  // state initializer made the client omit this node before hydration, causing
  // React to compare PageTransition against the server-rendered LoadingScreen.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (document.readyState === "complete") {
      setVisible(false);
      return;
    }

    const finish = () => setVisible(false);
    window.addEventListener("load", finish, { once: true });
    return () => window.removeEventListener("load", finish);
  }, []);

  if (!visible) return null;

  return <LoadingScreen />;
}
