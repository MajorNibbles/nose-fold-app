import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// Prevent Vite HMR client from triggering full page reload when mobile WebSocket disconnects
// during native camera capture
function preventMobileCameraDisconnectReload() {
  return {
    name: 'prevent-mobile-camera-disconnect-reload',
    transform(code: string, id: string) {
      if (id.includes('client.mjs') || id.includes('@vite/client')) {
        return code.replace(
          'if (payload.event === "vite:ws:disconnect") {',
          'if (false && payload.event === "vite:ws:disconnect") {'
        )
      }
      return null
    },
  }
}

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
      preventMobileCameraDisconnectReload(),
      react(),
      tailwindcss(),
      useHttps ? basicSsl() : undefined,
    ].filter(Boolean),
  }
})
