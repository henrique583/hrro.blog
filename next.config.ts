import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  // Baseline security headers for every response.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  cacheLife: {
    // Social feeds. They're refreshed once a day by the cron job in vercel.json
    // (app/api/refresh-feed). The 2-day revalidate is only a fallback in case
    // the cron doesn't run, e.g. when hosting somewhere without cron jobs.
    feed: {
      stale: 3600, // 1 hour
      revalidate: 172800, // 2 days
      expire: 2592000, // 30 days
    },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
