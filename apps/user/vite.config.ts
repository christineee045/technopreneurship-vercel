import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
  },
  optimizeDeps: {
    exclude: ['@radix-ui/react-slot'],
  },
  build: {
    rollupOptions: {
      external: [
        'fs',
        'path',
        'os',
        'http',
        'https',
        'stream',
        'crypto',
        'canvas',
        'fsevents'
      ]
    }
  }
})
