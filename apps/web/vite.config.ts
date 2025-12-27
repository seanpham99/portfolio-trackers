import path from "path"
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, mergeConfig } from "vite"
import { getBaseViteConfig } from "@repo/vite-config"

// https://vite.dev/config/
export default defineConfig((configEnv) => {
  const baseConfig = getBaseViteConfig()
  
  const appConfig = {
    plugins: [reactRouter()], // tailwindcss and tsconfigPaths are in baseConfig
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      watch: {
        ignored: ['**/*.test.tsx', '**/*.test.ts', '**/test/**'],
      },
    },
    // We can override or extend test config here if needed
    test: {
       setupFiles: './test/setup.ts',
       include: ['src/__tests__/**/*.test.{ts,tsx}'],
    }
  }

  return mergeConfig(baseConfig, appConfig)
})
