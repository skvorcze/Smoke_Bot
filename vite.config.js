import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  resolve: {
    dedupe: ['three'],
  },
  optimizeDeps: {
    exclude: ['three/webgpu', 'three/tsl'],
  },
  build: {
    target: 'esnext',
  },
});
