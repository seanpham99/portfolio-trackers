import { defineConfig } from "eslint/config";
import { config as sharedReactConfig } from "@workspace/eslint-config/react";

export default defineConfig([
  {
    ignores: ["dist", ".react-router", "node_modules"],
  },

  // Extend shared react configuration
  ...sharedReactConfig,
]);
