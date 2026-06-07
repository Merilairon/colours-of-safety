import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'path';

export default defineConfig({
  plugins: [angular({ jit: true, include: ['**/*.ts'] })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    alias: {
      'leaflet-draw': resolve(__dirname, 'src/__mocks__/leaflet-plugin-stub.js'),
      'leaflet.markercluster': resolve(__dirname, 'src/__mocks__/leaflet-plugin-stub.js'),
      './leaflet-setup': resolve(__dirname, 'src/__mocks__/leaflet-plugin-stub.js'),
    },
  },
});
