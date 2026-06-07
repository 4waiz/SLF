import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  // tesseract.js ships a web worker + wasm; keep it out of the optimizer so the
  // dynamic import() stays lazy and never blocks first paint.
  optimizeDeps: {
    exclude: ['tesseract.js'],
  },
})
