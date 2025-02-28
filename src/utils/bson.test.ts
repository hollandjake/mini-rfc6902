import { test, vi } from 'vitest';
import { deserializeBSON, serializeBSON } from './bson';

// Effectively unload bson from the loaded modules
vi.mock('bson', async () => ({ default: undefined, serialize: undefined, deserialize: undefined }));

test('error on bson missing', ({ expect }) => {
  expect(() => serializeBSON({})).toThrow(ReferenceError);
  expect(() => deserializeBSON(new Uint8Array())).toThrow(ReferenceError);
});
