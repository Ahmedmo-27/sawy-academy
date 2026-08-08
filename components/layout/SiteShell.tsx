"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { SiteContentProvider } from "@/components/cms/SiteContentProvider";
import { PlatformLogger } from "@/components/logging/PlatformLogger";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SplashLoader } from "@/components/SplashLoader";
import { ScrollAnimationShell } from "@/components/animation/ScrollAnimationShell";
import { PageTransition } from "@/components/animation/PageTransition";

interface SiteShellProps {
  children: React.ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <AuthProvider>
      <ToastProvider>
        <SiteContentProvider>
          <PlatformLogger />
          {isAdmin ? (
            <>{children}</>
          ) : (
            <CartProvider>
              <a
                href="#main-content"
                className="fixed left-4 top-4 z-[400] -translate-y-24 bg-charcoal px-4 py-3 text-sm font-medium text-concrete transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-clay focus:ring-offset-2"
              >
                Skip to main content
              </a>
              <SplashLoader />
              <PageTransition />
              <ScrollAnimationShell>
                <Navigation />
                <main
                  id="main-content"
                  tabIndex={-1}
                  className="flex-1 relative outline-none"
                >
                  {children}
                </main>
                <Footer />
              </ScrollAnimationShell>
            </CartProvider>
          )}
        </SiteContentProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
