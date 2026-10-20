import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        project: 'tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      '.claude/',
      'graphify-out/',
      'eslint.config.js',
      'vitest.config.ts',
    ],
  },
);
