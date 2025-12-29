/// <reference types="vite/client" />
/// <reference types="vitest" />

import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from "vite-tsconfig-paths"

export const baseViteConfig = defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    // Common aliases can go here if we enforce structure
  },
  // Common Vitest config
  test: {
    globals: true,
    passWithNoTests: true,
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, '**/node_modules/**'],
  },
})

// Legacy function export for backward compatibility
export const getBaseViteConfig = (isReactRouter: boolean = false) => baseViteConfig

// We can also just export the plugins if someone wants to compose manually
export const sharedPlugins = [
  tailwindcss(),
  tsconfigPaths(),
]
