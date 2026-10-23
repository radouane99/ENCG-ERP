import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { readFileSync } from 'node:fs'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'ENCG Fès ERP',
        short_name: 'ENCG ERP',
        description: 'University Management System for ENCG Fès',
        theme_color: '#A80A0B',
        background_color: '#F5F7FA',
        display: 'standalone',
        shortcuts: [
          { name: 'Notes', short_name: 'Notes', url: '/student/grades', description: 'Consulter les notes' },
          { name: 'Convocations', short_name: 'Convocs', url: '/student/convocations' },
          { name: 'Justificatif', short_name: 'Absence', url: '/student/absences' },
          { name: 'Présence cours', short_name: 'QR', url: '/student/attendance' },
        ],
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      },
      workbox: {
        // Precache the application shell; fetch feature bundles only when visited.
        manifestTransforms: [async (entries) => {
          const html = readFileSync(path.resolve(import.meta.dirname, 'dist/index.html'), 'utf8')
          const initialScripts = new Set([...html.matchAll(/(?:src|href)="\/(assets\/[^" ]+\.js)"/g)].map(match => match[1]))
          return {
            manifest: entries.filter(entry => !entry.url.endsWith('.js') || initialScripts.has(entry.url.replace(/^\//, ''))),
            warnings: [],
          }
        }],
        runtimeCaching: [{
          urlPattern: /\/assets\/.*\.js$/,
          handler: 'CacheFirst',
          options: { cacheName: 'encg-feature-scripts', expiration: { maxEntries: 128, maxAgeSeconds: 30 * 24 * 60 * 60 } },
        }],
      },
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@features': path.resolve(import.meta.dirname, './src/features'),
      '@shared': path.resolve(import.meta.dirname, './src/shared'),
      '@stores': path.resolve(import.meta.dirname, './src/stores'),
      '@app': path.resolve(import.meta.dirname, './src/app'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['erp.irsale.fr', '.irsale.fr', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://encg_nginx:80',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://encg_nginx:80',
        changeOrigin: true,
      },
      '/broadcasting': {
        target: 'http://reverb:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,

  },
})
