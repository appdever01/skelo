import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['.local/**', 'dist/**', 'node_modules/**', '**/dist/**', '**/.next/**', '**/next-env.d.ts', '**/*.svelte'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.cjs'], languageOptions: { globals: { module: 'readonly', require: 'readonly' } } },
  { files: ['**/*.{ts,tsx,mjs}'], languageOptions: { globals: { console: 'readonly', process: 'readonly', URL: 'readonly' } } },
);
