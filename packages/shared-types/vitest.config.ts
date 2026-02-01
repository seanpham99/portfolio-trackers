import { baseConfig } from "@workspace/vitest-config/base";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node", // shared-types is likely node/agnostic, no need for jsdom
    },
  })
);
