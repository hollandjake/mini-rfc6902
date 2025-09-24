import { test, vi } from 'vitest';

void vi.hoisted(async () => {
  const { Module } = await import('module');

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  Module._load_original = Module._load;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  Module._load = (uri, parent) => {
    if (uri === 'bson') return undefined;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return Module._load_original(uri, parent);
  };
});

// Effectively unload bson from the loaded modules
test('error on bson missing', async ({ expect }) => {
  const { serializeBSON, deserializeBSON } = await import('./bson.cjs');
  expect(() => serializeBSON({})).toThrow(ReferenceError);
  expect(() => deserializeBSON(new Uint8Array())).toThrow(ReferenceError);
});
