import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Enable turbopack for faster development
  turbopack: {},

  // Transpile workspace packages
  transpilePackages: ["@workspace/ui", "@workspace/shared-types"],

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

  // Configure pageExtensions to include md and mdx
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

export default withMDX(nextConfig);
