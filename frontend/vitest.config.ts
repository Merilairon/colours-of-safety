import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular({ jit: true, include: ['**/*.ts'] })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    alias: {
      'leaflet-draw': '/dev/null',
      'leaflet.markercluster': '/dev/null',
    },
  },
});
