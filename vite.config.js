import { defineConfig } from 'vite';

export default defineConfig({
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
