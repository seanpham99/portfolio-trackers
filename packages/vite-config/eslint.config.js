import baseConfig from "@workspace/eslint-config";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["dist/**", "build/**"],
  },
  ...baseConfig,
];
