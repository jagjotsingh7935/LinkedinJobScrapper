import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  plugins: [react()],
  base: '/',
  // base: '/static/',
  build: {
    outDir: path.resolve(__dirname, './dist'),
    assetsDir: 'assets',
    target: 'esnext', // Use 'esnext' for modern browsers and ES modules
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    sourcemap: false, // Or 'hidden' or 'source-map' as needed
    manifest: true,
  },
  server: {
    origin: 'http://localhost:5173',
    port: 5173,
    hmr: {
      overlay: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});