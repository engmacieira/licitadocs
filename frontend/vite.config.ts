import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Aponta para o Python
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''), // Remove '/api' antes de enviar
      },
    },
  },
  test: {
    globals: true,           // Permite usar describe, it, expect sem importar
    environment: 'jsdom',    // Simula navegador (DOM)
    setupFiles: './src/test/setup.ts', // Arquivo de setup que vamos criar
    css: false,              // Ignora processamento de CSS nos testes (mais rápido)
    coverage: {
      provider: 'v8', // ou 'istanbul'
      reporter: ['text', 'json', 'html'], // 👈 Garante que o 'html' está aqui
      reportsDirectory: './coverage',    // 👈 Garante o caminho da pasta
      clean: false,                      // 👈 Diz ao Vitest para NÃO apagar a pasta
    },
    testTimeout: 15000,
    hookTimeout: 15000,
  },
} as any)