import { config as baseConfig } from "@workspace/eslint-config/react";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...baseConfig,
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "**/*.disabled",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/__tests__/**",
    ],
  },
  {
    rules: {
      "prettier/prettier": ["error", { endOfLine: "auto" }],
      "@typescript-eslint/no-explicit-any": "warn", // Downgrade to warning
    },
  },
];

export default eslintConfig;
