import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      pako: path.resolve(__dirname, "node_modules/browserify-zlib/node_modules/pako"),
    },
  },
})
