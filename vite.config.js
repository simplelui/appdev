// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/threat-api': {
        target: 'https://urlhaus-api.abuse.ch',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/threat-api/, '/v1/urls/recent/'),
        // ADD THIS PART: It tells URLhaus you are a real browser
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      },
    },
  },
})