import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SplashLoader } from "@/components/SplashLoader";
import { ScrollAnimationShell } from "@/components/animation/ScrollAnimationShell";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sawy Academy — Mohamed El Sawy",
  description:
    "Architecture portfolio, academic courses, and studio resources by Prof. Mohamed El Sawy, Cairo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">
        <CartProvider>
          <SplashLoader />
          <ScrollAnimationShell>
            <Navigation />
            <main id="main-content" className="flex-1 relative">{children}</main>
            <Footer />
          </ScrollAnimationShell>
        </CartProvider>
      </body>
    </html>
  );
}
