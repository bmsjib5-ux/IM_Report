import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GITHUB_PAGES=true → base="/IM_Report/" สำหรับ deploy web
// ปกติ (Electron) → base="./"
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon.png'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/script\.google\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-apps-script-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 5 },
            },
          },
        ],
      },
    }),
  ],
  base: isGitHubPages ? '/IM_Report/' : './',
})
