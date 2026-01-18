import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime'
    }
  },
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
        error: 'error.html',
      }
    }
  }
})
