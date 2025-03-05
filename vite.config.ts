import { Measurement } from '@codspeed/core';
import codspeedPlugin from '@codspeed/vitest-plugin';
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
    fileParallelism: true,
  },
  build: {
    target: 'ES2020',
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
          plugins: [terser({ keep_classnames: true })],
          globals: {
            bson: 'BSON',
          },
        },
      ],
    },
  },
  plugins: [
    ...(Measurement.isInstrumented() ? [codspeedPlugin()] : []),
    requireTransform(),
    dts({
      rollupTypes: true,
      exclude: ['**/*.test.ts'],
      async afterBuild() {
        await copyFile('dist/index.d.cts', 'dist/index.d.mts');
      },
    }),
  ],
});
