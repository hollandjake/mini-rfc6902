import { copyFileSync } from 'node:fs';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
    },
  },
  build: {
    target: 'es6',
    minify: false,
    lib: {
      entry: 'src/index.ts',
      name: 'rfc6902',
      fileName: 'index',
      formats: ['es', 'cjs', 'umd'],
    },
  },
  plugins: [
    dts({
      rollupTypes: true,
      exclude: ['**/*.test.ts'],
      afterBuild: () => {
        copyFileSync('dist/index.d.ts', 'dist/index.d.mts');
      },
    }),
  ],
});
