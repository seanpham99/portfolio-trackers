import baseConfig from "@workspace/eslint-config/base.js";
import reactConfig from "@workspace/eslint-config/react.js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  ...reactConfig,
];
