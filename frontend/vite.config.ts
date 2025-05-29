import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND_ORIGIN = process.env.VITE_API_PROXY ?? 'http://localhost:8000';

export default defineConfig({
  // ⚠️ шлях, за яким розгортатиметься статичний build (GitHub Pages тощо)
  base: '/finance-tracker1/',

  plugins: [react()],

  /* ───── dev-proxy ───── */
  server: {
    port: 5173,
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
