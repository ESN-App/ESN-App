/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// The API is always called same-origin (`/api/...`). In development Vite proxies it to the
// backend; in production nginx does (docker/nginx.conf), so no CORS is needed anywhere.
const backend = process.env['API_PROXY_TARGET'] ?? 'http://localhost:5000';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // public/manifest.webmanifest is linked from index.html and kept as the source of truth.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,webmanifest}'],
        // Kill switch for the old Angular service worker, see public/ngsw-worker.js.
        globIgnores: ['ngsw-worker.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/health/, /^\/swagger/],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 4200,
    proxy: {
      '/api': { target: backend, changeOrigin: false },
      '/health': { target: backend, changeOrigin: false },
    },
  },
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
