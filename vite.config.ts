import terser from '@rollup/plugin-terser';
import { copyFile } from 'node:fs/promises';
import dts from 'vite-plugin-dts';
import requireTransform from 'vite-plugin-require-transform';
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
    },
    rollupOptions: {
      external: ['bson'],
      output: [
        {
          format: 'es',
          entryFileNames: 'index.mjs',
        },
        {
          format: 'cjs',
          entryFileNames: 'index.cjs',
        },
        {
          format: 'umd',
          entryFileNames: 'index.umd.js',
          name: 'rfc6902',
          plugins: [terser()],
          globals: {
            bson: 'BSON',
          },
        },
      ],
    },
  },
  plugins: [
    requireTransform(),
    dts({
      rollupTypes: true,
      exclude: ['**/*.test.ts'],
      async afterBuild() {
        await copyFile('dist/index.d.mts', 'dist/index.d.cts');
      },
    }),
  ],
});
