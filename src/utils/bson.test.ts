import { test, vi } from 'vitest';

await vi.hoisted(async () => {
  const { Module } = await import('node:module');

  // @ts-expect-error
  Module._load_original = Module._load;
  // @ts-expect-error
  Module._load = (uri, parent) => {
    if (uri === 'bson') return undefined;
    // @ts-expect-error
    return Module._load_original(uri, parent);
  };
});

// Effectively unload bson from the loaded modules
test('error on bson missing', async ({ expect }) => {
  const { serializeBSON, deserializeBSON } = await import('./bson');
  expect(() => serializeBSON({})).toThrow(ReferenceError);
  expect(() => deserializeBSON(new Uint8Array())).toThrow(ReferenceError);
});
