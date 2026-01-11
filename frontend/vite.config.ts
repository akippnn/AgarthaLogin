import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        login: 'login.html',
        register: 'register.html',
        sessionauth: 'sessionauth.html',
        admin: 'admin.html',
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
