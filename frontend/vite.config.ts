import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Allow local-dev.wipo.int (add to /etc/hosts: 127.0.0.1 local-dev.wipo.int)
    host: true,
    allowedHosts: ['local-dev.wipo.int'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../deployment/artifacts/frontend',
    emptyOutDir: true,
  },
});
