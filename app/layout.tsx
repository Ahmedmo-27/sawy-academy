import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { SiteShell } from "@/components/layout/SiteShell";
import { getSiteUrl } from "@/lib/site-url";

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
  metadataBase: getSiteUrl(),
  applicationName: "Sawy Academy",
  title: {
    default: "Sawy Academy — Mohamed El Sawy",
    template: "%s | Sawy Academy",
  },
  description:
    "Architecture portfolio, academic courses, and studio resources by Prof. Mohamed El Sawy, Cairo.",
  keywords: [
    "architecture academy",
    "architecture courses",
    "Mohamed El Sawy",
    "architecture portfolio",
    "Cairo",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Sawy Academy",
    title: "Sawy Academy — Mohamed El Sawy",
    description:
      "Architecture portfolio, academic courses, and studio resources by Prof. Mohamed El Sawy, Cairo.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Sawy Academy architectural studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sawy Academy — Mohamed El Sawy",
    description:
      "Architecture portfolio, academic courses, and studio resources by Prof. Mohamed El Sawy, Cairo.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/icon",
    apple: "/icon",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Keep layout viewport stable when the virtual keyboard opens on mobile.
  interactiveWidget: "overlays-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen flex flex-col">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
