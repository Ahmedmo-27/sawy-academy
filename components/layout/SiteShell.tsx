"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { SiteContentProvider } from "@/components/cms/SiteContentProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SplashLoader } from "@/components/SplashLoader";
import { ScrollAnimationShell } from "@/components/animation/ScrollAnimationShell";

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
          {isAdmin ? (
            <>{children}</>
          ) : (
            <CartProvider>
              <SplashLoader />
              <ScrollAnimationShell>
                <Navigation />
                <main className="flex-1 relative">{children}</main>
                <Footer />
              </ScrollAnimationShell>
            </CartProvider>
          )}
        </SiteContentProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
