import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Los tests de componentes simulan al usuario tecleando campo por campo; en los runners
    // del CI, más lentos que una máquina local, 5 s por defecto deja poco margen.
    testTimeout: 10_000,
  },
})
