import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [
        resolve(__dirname, 'public'), // Allow serving files from the 'public' directory
        resolve(__dirname, 'src'),
        resolve(__dirname, 'public/models'), // Ensure models directory is accessible
      ],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
})
