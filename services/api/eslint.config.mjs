// @ts-check
import { defineConfig } from 'eslint/config';
import sharedConfig from '@workspace/eslint-config';

export default defineConfig([
  {
    ignores: ['eslint.config.mjs', 'dist/**'],
  },
  // Load shared config from @workspace/eslint-config
  ...sharedConfig,

  // Local overrides
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
]);
