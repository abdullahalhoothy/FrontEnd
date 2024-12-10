import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/fastapi': {
        target: 'http://s-locator.northernacs.com:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fastapi/, '/fastapi'),
      }
    },
    port: 3000,
    host: "0.0.0.0",
  },
  preview: {
    port: 3000,
    host: "0.0.0.0",
  },
});