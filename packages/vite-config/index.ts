/// <reference types="vite/client" />
/// <reference types="vitest" />

import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { type UserConfig } from "vite"

export const getBaseViteConfig = (isReactRouter: boolean = false): UserConfig => {
  const plugins = [
    tailwindcss(),
    tsconfigPaths(),
  ]

  // Note: reactRouter plugin must be added by the consuming app if needed
  // as it requires @react-router/dev/vite dependency which we might not want to force here universally if we have non-RR apps?
  // But for now, let's keep it simple.

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

// We can also just export the plugins if someone wants to compose manually
export const sharedPlugins = [
  tailwindcss(),
  tsconfigPaths(),
]
