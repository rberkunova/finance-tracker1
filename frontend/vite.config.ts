import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,              // dev-сервер фронтенду
    proxy: {
      // ⬇️ усе, що починається з /api, піде на Gateway (8000)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,       // backend працює по http
        // НІЯКОГО rewrite — /api залишається у шляху
      },
    },
  },
});