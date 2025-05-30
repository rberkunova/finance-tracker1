import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND_ORIGIN = process.env.VITE_API_PROXY ?? 'http://gateway:8000';

export default defineConfig({
  // ⚠️ шлях, за яким розгортатиметься статичний build (GitHub Pages тощо)
  base: '/finance-tracker1/',

  plugins: [react()],

  /* ───── dev-proxy ───── */
  server: {
    host: true,  // Shorthand for 0.0.0.0. Listen all addresses
    port: 5173,  // dev-сервер фронтенду
    proxy: {
      '/api': {
        target: BACKEND_ORIGIN,  //  наприклад http://localhost:8000
        changeOrigin: true,
        secure: false,
        // залишаємо шлях як є → /api/....
        rewrite: p => p,
      },
    },
  },
});
