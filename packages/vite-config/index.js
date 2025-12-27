// @ts-check
import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from "vite-tsconfig-paths"

/**
 * Get base Vite configuration for all apps in the monorepo
 * @param {boolean} [isReactRouter] - Whether this app uses React Router
 * @returns {import('vite').UserConfig}
 */
export function getBaseViteConfig(isReactRouter = false) {
  const plugins = [
    tailwindcss(),
    tsconfigPaths(),
  ]

  // Note: reactRouter plugin must be added by the consuming app
  // as it requires @react-router/dev/vite dependency

  return {
    plugins,
    resolve: {
      // Common aliases can go here if we enforce structure
    },
    // Common Vitest config
    test: {
      globals: true,
      passWithNoTests: true,
      environment: 'jsdom',
    },
  }
}

/**
 * Shared Vite plugins for manual composition
 */
export const sharedPlugins = [
  tailwindcss(),
  tsconfigPaths(),
]
