import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // 让 esbuild/lightningcss 保留传统 max-width 写法，
    // 避免输出 (width<=768px) 这种 Level-4 range 语法，
    // 旧版 Android 系统浏览器不支持该语法会导致移动端样式全部失效。
    cssTarget: ['chrome87', 'firefox78', 'safari14', 'edge88'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
