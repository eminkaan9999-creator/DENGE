import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages uygulamayı alan adı kökünde değil, /DENGE/ altında sunar.
  base: '/DENGE/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'personel_ornek.json'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@mediapipe\/tasks-vision\/.*$/i,
            handler: 'CacheFirst',
            options: { cacheName: 'mediapipe-wasm', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 } }
          },
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com\/mediapipe-models\/.*$/i,
            handler: 'CacheFirst',
            options: { cacheName: 'mediapipe-model', expiration: { maxEntries: 3, maxAgeSeconds: 60 * 60 * 24 * 30 } }
          }
        ]
      }
    })
  ]
})
