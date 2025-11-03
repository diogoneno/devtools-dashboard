import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Development server configuration
  server: {
    port: 5173,
    // Optional: Proxy API requests during development to avoid CORS issues
    // Uncomment if you want to use /api/* paths in development
    /*
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    */
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false, // Set to true for debugging production builds
  },

  // Environment variable prefix - only VITE_ prefixed vars are exposed to client
  envPrefix: 'VITE_',
})
