import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { dlhdM3u8Plugin } from './vite-plugin-dlhd-m3u8'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react(), dlhdM3u8Plugin()],
  server: {
    port: 3000,
    proxy: {
      '/api/tmdb': {
        target: 'https://api.themoviedb.org/3',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api\/tmdb/, ''),
      },
      '/api/dlhd/channels-page': {
        target: 'https://dlhd.pk',
        changeOrigin: true,
        rewrite: () => '/24-7-channels.php',
      },
      '/api/dlhd/resolve': {
        target: 'https://dlhd.pk',
        changeOrigin: true,
        rewrite: (requestPath) => {
          const url = new URL(requestPath, 'http://localhost');
          const path = url.searchParams.get('path') || 'watch';
          const id = url.searchParams.get('id') || '1';
          return `/${path}/stream-${id}.php`;
        },
      },
      '/api/dlhd': {
        target: 'https://dlhd.pk',
        changeOrigin: true,
        rewrite: (requestPath) => {
          const endpoint = requestPath.replace(/^\/api\/dlhd\/?/, '') || 'channels';
          const key = process.env.VITE_DLHD_API_KEY ?? '';
          return `/daddyapi.php?endpoint=${encodeURIComponent(endpoint)}&key=${encodeURIComponent(key)}`;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
