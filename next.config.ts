import type { NextConfig } from "next";

const apiProxyTarget =
  process.env.API_PROXY_TARGET ??
  (process.env.NODE_ENV === "production"
    ? "https://sawy-academy.onrender.com"
    : "http://localhost:5000");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/contact",
        destination: "/api/contact",
      },
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
