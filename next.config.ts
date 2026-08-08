import type { NextConfig } from "next";
import createBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const apiProxyTarget =
  process.env.API_PROXY_TARGET ??
  (process.env.NODE_ENV === "production"
    ? "https://sawy-academy.onrender.com"
    : "http://localhost:5000");

function isSameOriginProxy(target: string) {
  const vercelUrl = process.env.VERCEL_URL;
  if (!vercelUrl) return false;

  try {
    const targetHost = new URL(target).host;
    return targetHost === vercelUrl || targetHost === `www.${vercelUrl}`;
  } catch {
    return false;
  }
}

const nextConfig: NextConfig = {
  experimental: {
    // The generated Tailwind bundle is small (~15 KiB). Inlining it removes
    // the render-blocking stylesheet request from the first-load waterfall.
    inlineCss: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sawy-academy.onrender.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
    ],
  },
  async rewrites() {
    const localContactRewrite = {
      source: "/api/contact",
      destination: "/api/contact",
    };

    // Render should run the Express API (server.js), not Next.js. Proxying /api
    // to the same Render host causes a 508 loop when Next.js is deployed there.
    if (process.env.RENDER) {
      return [localContactRewrite];
    }

    if (isSameOriginProxy(apiProxyTarget)) {
      console.warn(
        "API_PROXY_TARGET points at this Vercel deployment; skipping API rewrites to avoid a proxy loop."
      );
      return [localContactRewrite];
    }

    return [
      localContactRewrite,
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
