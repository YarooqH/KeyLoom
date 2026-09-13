import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
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
