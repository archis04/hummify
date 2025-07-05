import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    host: '0.0.0.0',          // ✅ Allows access from browser via localhost
    watch: {
      usePolling: true,       // ✅ Fixes file change detection in Docker
    },
    proxy: {
      '/api': {
        target:  process.env.VITE_BACKEND_URL,        
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
