import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * ============================================================================
 * VITE BUILD & PERFORMANCE CONFIGURATION
 * ============================================================================
 * Industry-standard manual chunking for optimal browser caching & fast first-paint.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-utils': ['axios', 'dompurify']
        }
      }
    }
  }
});
