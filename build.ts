import { build } from 'tsdown';

await build({
  entry: ['./src/index.ts'],
  outDir: './dist',
  platform: 'neutral',
  target: 'es6',
  outputOptions: {
    name: 'rfc6902',
  },
  fixedExtension: true,
  format: ['es', 'cjs', 'umd'],
  deps: {
    neverBundle: ['bson'],
  },
  dts: true,
  clean: true,
});
