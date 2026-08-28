import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// สายเลข — real-time bus checker
// PWA config ทำให้ "ติดตั้งหน้าเว็บ" แทนการโหลดแอปหนัก ๆ (ตอบโจทย์ pain point เรื่อง 3G/มือถือ)
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'สายเลข — เช็คสายรถเมล์ Real-time',
        short_name: 'สายเลข',
        description: 'ค้นหาและติดตามรถเมล์แบบเรียลไทม์ เบา เร็ว ใช้ได้แม้เน็ตช้า',
        theme_color: '#14171C',
        background_color: '#14171C',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        // cache ป้ายรถ/หน้าค้นหาไว้ ให้เปิดซ้ำได้แม้ offline ตรงกับ opportunity "local storage / เปิดโปรแกรมได้ทันที"
        globPatterns: ['**/*.{js,css,html,svg,png}']
      }
    })
  ],
  build: {
    target: 'es2018',
    sourcemap: false
  }
})
