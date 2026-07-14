import codspeedPlugin from '@codspeed/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    chaiConfig: {
      truncateThreshold: 100,
    },
    coverage: {
      include: ['src'],
    },
  },
  plugins: [codspeedPlugin()],
});
