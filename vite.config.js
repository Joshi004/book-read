import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Use the repo-name sub-path on GitHub Pages; relative path for local dev.
  base: process.env.GITHUB_ACTIONS ? '/book-read/' : './',
  plugins: [
    react(),
    VitePWA({
      // 'prompt' only: a new build must never silently reload a reader mid-chapter.
      // See src/components/UpdatePrompt.jsx, which owns the actual reload trigger.
      registerType: 'prompt',
      injectRegister: null, // registered manually via virtual:pwa-register/react
      manifest: {
        name: 'Behavior Ops — Charles Huge',
        short_name: 'Behavior Ops',
        description:
          'Behavior Ops by Charles Huge — the field manual for influence and behavioral tradecraft.',
        display: 'standalone',
        background_color: '#FBFAF6',
        theme_color: '#2E5A87',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Default is js,css,html only; widen to precache diagram images and icons too.
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Fetched lazily on first search-dialog open (not precached via
            // globPatterns — that would defeat the point). Serve instantly
            // from cache (works offline), refresh in the background: content
            // only changes via infrequent git-commit-triggered deploys, so an
            // index one deploy behind is a non-issue, self-healing on the
            // next open.
            urlPattern: /\/search-index\/corpus\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'search-index',
              expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
