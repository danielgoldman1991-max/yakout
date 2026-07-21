import type { NextConfig } from "next";

const airbnbRuntimeFiles = [
  "./node_modules/playwright-core/browsers.json",
  "./node_modules/playwright-core/lib/**/*",
  "./node_modules/@sparticuz/chromium/bin/**/*",
  "./node_modules/@sparticuz/chromium/build/**/*",
  "./node_modules/@sparticuz/chromium/package.json",
];

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "playwright-core",
    "@sparticuz/chromium",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "rplnihauyeifaldcjntx.supabase.co" },
    ],
  },
  outputFileTracingIncludes: {
    "/api/airbnb/analyze": airbnbRuntimeFiles,
    "/dashboard/apartments/import": airbnbRuntimeFiles,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
