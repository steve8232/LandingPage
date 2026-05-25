import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the headless-browser packages out of Next's bundler. The sparticuz
  // chromium binary is a brotli-compressed blob extracted at runtime, and
  // playwright-core ships native bindings — both fail when traced/minified.
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core"],
};

export default nextConfig;
