/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The codebase keeps JSX inside `.js` files (no `.jsx`), so esbuild is told to
// treat `src/**/*.js` as JSX for both source transform and dependency pre-bundling.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    // Keep CRA's output dir so the Dockerfile/nginx setup stays unchanged.
    outDir: 'build',
  },
  envPrefix: 'VITE_',
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules', 'build', 'e2e'],
  },
});
