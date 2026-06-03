import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to be reached through the cloudflared tunnel host
  // (otherwise Next blocks cross-origin dev resources like HMR). Update this if
  // the tunnel URL changes. Safe to remove in production.
  allowedDevOrigins: [
    "excellent-oriental-butler-justin.trycloudflare.com",
    "*.trycloudflare.com",
  ],
};

export default nextConfig;
