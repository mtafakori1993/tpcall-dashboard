import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Local development against the mock API (scripts/mock-api.mjs) or a real backend:
    //   VITE_API_BASE=http://localhost:9090 npm run dev
    port: 5173,
  },
})
