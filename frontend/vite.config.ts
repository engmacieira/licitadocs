import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Garante que o Tailwind v4 funcione bem
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // O endereço do Python
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove o '/api' antes de mandar pro Python
      },
    },
  },
})