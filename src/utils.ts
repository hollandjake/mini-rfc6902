import { Document, serialize as serializeBSON } from 'bson';
import justClone from 'just-clone';
/**
 * Simulate what mongoose is going to store the data as
 *
 * Useful for determining data storage size and also comparing diffs
 */
export function serialize(a: unknown): Buffer {
  if (Array.isArray(a)) a = a.reduce((a, v, k) => ({ ...a, [`${k}`]: v }), {});
  if (typeof a !== 'object') a = { a };
  return serializeBSON(a as Document, { serializeFunctions: true }) as Buffer;
}

export function eq(x: unknown, y: unknown) {
  return serialize(x).equals(serialize(y));
}

export function clone<T>(val: T): T {
  return justClone(val as never);
}

export type AnyArray = Array<unknown>;
