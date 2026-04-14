import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path' // 🟢 Adicione este import se não tiver

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 🟢 Detetamos se estamos a correr testes do Vitest
  const isTest = mode === 'test' || process.env.VITEST;

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // 🟢 Os mocks só serão aplicados se isTest for verdadeiro
        ...(isTest ? {
          '@react-pdf/renderer': path.resolve(__dirname, './src/test/mocks/react-pdf.ts'),
          'docx': path.resolve(__dirname, './src/test/mocks/empty-mock.ts'),
          'file-saver': path.resolve(__dirname, './src/test/mocks/empty-mock.ts'),
        } : {})
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, ''),
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
    },
  }
})