import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3232,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:2727',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})