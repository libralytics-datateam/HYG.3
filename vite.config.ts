import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // Exclude Python venv and data directories from file watching
      ignored: [
        path.resolve(__dirname, 'data'),
        '**/.venv/**',
        '**/node_modules/**',
      ]
    }
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-router') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})

