import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const useHttps = process.env.HTTPS === 'true' || mode === 'https'
  return {
    base: './',
    server: {
      host: true, // Listen on all network addresses (0.0.0.0)
      port: 5173,
    },
    plugins: [
      react(),
      tailwindcss(),
      useHttps ? basicSsl() : undefined,
    ].filter(Boolean),
  }
})
