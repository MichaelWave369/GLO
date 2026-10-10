import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/GLO/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'GLO Pin - Good Lookin Out',
        short_name: 'GLO Pin',
        description: 'Find what you need. Share what you know.',
        start_url: '/GLO/',
        scope: '/GLO/',
        display: 'standalone',
        theme_color: '#122d38',
        background_color: '#f4f7f3',
        icons: [{ src: '/GLO/glo-pin.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,ico,webmanifest}'],
        navigateFallback: '/GLO/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true
      }
    })
  ]
})
