// แอปทำงานในเครื่องทั้งหมด (ไม่มีเซิร์ฟเวอร์) เพื่อขึ้น GitHub Pages ได้
import tailwindcss from '@tailwindcss/vite'

const base = process.env.NUXT_APP_BASE_URL ?? '/'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/main.css'],
  vite: { plugins: [tailwindcss()] },
  app: {
    baseURL: base,
    head: {
      htmlAttrs: { lang: 'th' },
      title: 'จดจ่าย',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#f4f5f7' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'จดจ่าย' },
      ],
      link: [
        // ไอคอนบนหน้าจอโฮม (แปลงจาก .ico ด้วย tools/icons-from-ico.mjs)
        { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` },
        { rel: 'icon', type: 'image/png', href: `${base}favicon.png` },
        { rel: 'manifest', href: `${base}manifest.webmanifest` },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap' },
      ],
    },
  },
})
