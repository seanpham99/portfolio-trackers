/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./test/setup.ts",
    include: [
      "src/__tests__/**/*.test.{ts,tsx}",
      "src/components/**/*.test.{ts,tsx}",
      "src/api/**/*.test.{ts,tsx}",
      "src/hooks/**/*.test.{ts,tsx}",
      "src/routes/**/*.test.{ts,tsx}",
      "src/features/**/*.test.{ts,tsx}",
    ],
  },
});
