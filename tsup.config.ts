import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts', 'quality/react': 'src/quality/react.tsx', next: 'src/next.ts' },
    format: ['esm', 'cjs'], dts: true, splitting: false,
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    banner: { js: '"use client";' },
  },
  {
    entry: { types: 'src/types.ts', 'core/index': 'src/core/index.ts', 'web/observe': 'src/web/observe.ts', 'quality/checker': 'src/quality/checker.ts', 'quality/compare': 'src/quality/compare.ts', 'quality/index': 'src/quality/index.ts', 'vue/index': 'src/vue/index.ts' },
    format: ['esm', 'cjs'], dts: true, splitting: false, external: ['vue'],
  },
  {
    entry: { 'native/index': 'src/native/index.tsx' },
    format: ['esm', 'cjs'], dts: true, splitting: false,
    external: ['react', 'react-native', 'react/jsx-runtime'],
  },
  {
    entry: { cli: 'src/cli.ts' }, format: ['esm'], platform: 'node',
    splitting: false, banner: { js: '#!/usr/bin/env node' },
  },
]);
