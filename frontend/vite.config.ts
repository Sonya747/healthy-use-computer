import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 如果使用子目录建议单独配置
      '@assets': path.resolve(__dirname, './src/assets') 
    }
  }
})
