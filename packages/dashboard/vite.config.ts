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
    // Target modern browsers for smaller bundles
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Enable module preload for better loading performance
    modulePreload: {
      polyfill: true,
      // Only preload critical chunks, not lazy-loaded ones
      resolveDependencies: (filename, deps) => {
        // Don't preload vendor chunks that are lazy loaded
        const lazyChunks = ['vendor-pdf', 'vendor-excel', 'vendor-charts', 'vendor-sanitize', 'vendor-icons'];
        return deps.filter(dep => !lazyChunks.some(chunk => dep.includes(chunk)));
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - loaded immediately
          'vendor-react': ['react', 'react-dom'],
          // Icons - separate chunk, loaded on first icon render
          'vendor-icons': ['lucide-react'],
          // PDF generation - lazy loaded on export
          'vendor-pdf': ['jspdf'],
          // Excel generation - lazy loaded on export
          'vendor-excel': ['exceljs'],
          // Charting library - lazy loaded with TrendCharts
          'vendor-charts': ['recharts'],
          // HTML sanitization - loaded on demand
          'vendor-sanitize': ['dompurify'],
        },
      },
    },
  },
});