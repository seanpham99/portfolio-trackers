/// <reference types="vite/client" />

import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { type UserConfig } from "vite";

/**
 * Get base Vite configuration for all apps in the monorepo.
 * Note: Each app should merge this with their own test configuration.
 */
export function getBaseViteConfig(): UserConfig {
  const plugins = [tailwindcss(), tsconfigPaths()];

  // Note: reactRouter plugin must be added by the consuming app
  // as it requires @react-router/dev/vite dependency

  return {
    plugins,
    resolve: {
      // Common aliases can go here if we enforce structure
    },
  };
}

// We can also just export the plugins if someone wants to compose manually
export const sharedPlugins = [tailwindcss(), tsconfigPaths()];
