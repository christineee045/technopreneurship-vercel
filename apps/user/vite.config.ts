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
      external: (id) => {
        if (!id) return false
        // Externalize Node built-ins, node: imports, and common native/server libs
        const nodeLibs = ['fs','path','os','http','https','stream','crypto','util','url','zlib','net','tls','dns']
        const nativeLike = ['fsevents','canvas','sharp','better-sqlite3','sqlite3','pg','mysql','bcrypt','argon2']
        if (id.startsWith('node:')) return true
        if (nodeLibs.includes(id)) return true
        for (const n of nativeLike) if (id === n || id.startsWith(n + '/')) return true
        return false
      }
    }
  }
})
