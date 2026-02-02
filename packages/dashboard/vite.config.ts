import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  customLogger: {
    ...console,
    error: (msg: string) => {
      // Suppress proxy connection errors (API not running during E2E tests)
      if (!msg.includes('http proxy error')) {
        console.error(msg);
      }
    },
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
});