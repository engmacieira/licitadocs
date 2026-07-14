import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path' 

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 1. Isola o motor de geração de PDF
              if (id.includes('@react-pdf')) {
                return 'vendor-pdf';
              }
              // 2. Isola a geração de Word (.docx) e salvamento de arquivos
              if (id.includes('docx') || id.includes('file-saver')) {
                return 'vendor-documents';
              }
              // 3. Isola ferramentas pesadas de Telemetria/Analytics (Sentry e Posthog)
              if (id.includes('@sentry') || id.includes('posthog-js')) {
                return 'vendor-telemetry';
              }
              // 4. Isola a biblioteca de ícones para evitar peso no core
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              
              // Todo o resto (React, React Router, Tailwind, etc.) vai para o core principal
              return 'vendor-core';
            }
          },
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