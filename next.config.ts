import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the headless-browser packages out of Next's bundler. The sparticuz
  // chromium binary is a brotli-compressed blob extracted at runtime, and
  // playwright-core ships native bindings — both fail when traced/minified.
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core"],
  // @vercel/nft static-traces require() calls but misses playwright-core's
  // dynamic load of browsers.json and the sparticuz brotli binary at
  // node_modules/@sparticuz/chromium/bin. Force-include both for the snapshot
  // route so the Lambda has the data files alongside the JS at runtime.
  outputFileTracingIncludes: {
    "/api/internal/snapshot": [
      "./node_modules/playwright-core/**/*",
      "./node_modules/@sparticuz/chromium/**/*",
    ],
  },
};

export default nextConfig;

