import { defineConfig } from 'vite';

// base './' → GitHub Pages(하위 경로)에서도 그대로 동작
export default defineConfig({
  base: './',
  server: { host: true },
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
});
