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
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - loaded immediately
          'vendor-react': ['react', 'react-dom'],
          // PDF generation - lazy loaded on export
          'vendor-pdf': ['jspdf', 'html2canvas'],
          // Excel generation - lazy loaded on export
          'vendor-excel': ['exceljs'],
        },
      },
    },
  },
});