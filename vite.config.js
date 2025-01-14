import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // 确保这里的端口号与服务器端口一致
        changeOrigin: true
      }
    }
  }
}) 