import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    // 兼容老旧/国产手机浏览器（自动生成 legacy 包 + polyfill）
    legacy({
      targets: ['defaults', 'Android >= 4.4', 'iOS >= 9', 'Chrome >= 49'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
  ],
  build: {
    target: 'es2015',
    cssTarget: 'chrome61',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
