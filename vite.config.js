import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://10.0.0.27:5048', // //change here if the device IP changes
        changeOrigin: true,
        secure: false
      }
    }
  }
})