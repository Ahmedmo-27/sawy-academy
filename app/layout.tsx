import type { Metadata, Viewport } from "next";
import {
  Amiri,
  Archivo,
  Cinzel,
  Cormorant_Garamond,
  Fraunces,
  IBM_Plex_Mono,
  Inter,
  Newsreader,
  Outfit,
} from "next/font/google";
import Script from "next/script";
// Bilingual / Arabic font configuration (commented out)
// import { IBM_Plex_Sans_Arabic } from "next/font/google";
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

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-amiri",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

/*
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});
*/

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
      className={`${fraunces.variable} ${inter.variable} ${cormorant.variable} ${archivo.variable} ${newsreader.variable} ${outfit.variable} ${plexMono.variable} ${amiri.variable} ${cinzel.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col">
        <Script id="sawy-theme-boot" strategy="beforeInteractive">
          {`try{var a=["atelier","obsidian","corten","instrument","ledger","lecture","arabesque","pharaonic"];var t=localStorage.getItem("sawy-theme");if(a.indexOf(t)!==-1)document.documentElement.setAttribute("data-theme",t);}catch(e){}`}
        </Script>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
