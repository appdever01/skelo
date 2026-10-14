import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  resolve: { conditions: ['browser'] },
  test: { environment: 'jsdom', maxWorkers: 2, setupFiles: ['tests/setup.ts'], include: ['tests/**/*.test.{ts,tsx}'], exclude: ['tests/native/**'] },
});
