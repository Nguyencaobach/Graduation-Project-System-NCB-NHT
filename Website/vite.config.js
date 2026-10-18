import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss() // Kích hoạt Tailwind v4 trực tiếp tại đây
  ],
  build: {
    sourcemap: false,
  },
  server: {
    port: 5173, // Cố định chạy ở cổng 5173
  }
})