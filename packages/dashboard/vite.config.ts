import { defineConfig, createLogger } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const logger = createLogger();
const originalWarning = logger.warn.bind(logger);
logger.warn = (msg, options) => {
  // Suppress proxy connection errors (API not running during E2E tests)
  if (msg.includes('http proxy error')) return;
  originalWarning(msg, options);
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  customLogger: logger,
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
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "use client" directive warnings from dependencies
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        // Suppress unresolved import warnings for optional peer deps
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        warn(warning);
      },
    },
  },
});