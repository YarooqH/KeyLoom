import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/keyloom/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    preserveSymlinks: true
  },
  optimizeDeps: {
    include: ['keyloom']
  },
  build: {
    commonjsOptions: {
      include: [/keyloom/, /node_modules/]
    }
  }
})
