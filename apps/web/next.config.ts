import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable turbopack for faster development
  turbopack: {},

  // Transpile workspace packages
  transpilePackages: [
    "@workspace/ui",
    "@workspace/api-types",
    "@workspace/database-types",
  ],

  // Strict mode for catching bugs early
  reactStrictMode: true,

  // Image configuration (add domains as needed)
  images: {
    remotePatterns: [],
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  },
};

export default nextConfig;
