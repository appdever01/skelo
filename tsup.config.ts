import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts', 'quality/react': 'src/quality/react.tsx' },
    format: ['esm', 'cjs'], dts: true, splitting: false,
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    banner: { js: '"use client";' },
  },
  {
    entry: { 'quality/index': 'src/quality/index.ts' },
    format: ['esm', 'cjs'], dts: true, splitting: false,
  },
  {
    entry: { cli: 'src/cli.ts' }, format: ['esm'], platform: 'node',
    splitting: false, banner: { js: '#!/usr/bin/env node' },
  },
]);
