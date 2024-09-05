import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
    },
  },
  build: {
    rollupOptions: {
      external: ['bson'],
    },
    target: 'es6',
    minify: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, './src/index.ts'),
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
  },
  plugins: [dts({ exclude: ['**/*.test.ts'] })],
});
