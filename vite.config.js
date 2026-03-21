import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Fix "global is not defined" for algosdk and other Node.js packages
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Polyfill the 'buffer' module for browser compatibility
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
})
