import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

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
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@app': path.resolve(__dirname, './src/app'),
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router')) {
              return 'vendor-react-core';
            }
            if (id.includes('@tanstack') || id.includes('zustand')) {
              return 'vendor-state';
            }
            if (id.includes('recharts') || id.includes('chart.js') || id.includes('lucide-react')) {
              return 'vendor-ui-visuals';
            }
            return 'vendor-others';
          }
        },
      },
    },
  },
})
