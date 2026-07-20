import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "rplnihauyeifaldcjntx.supabase.co" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  serverExternalPackages: ["@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/airbnb/analyze": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/playwright-core/browsers.json",
      "./node_modules/playwright-core/lib/**/*.js",
    ],
  },
};

export default nextConfig;
