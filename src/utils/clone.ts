import { CloneOpts, Cloner, skip, SKIP, WithSkip } from './types';

const defaultCloners: Cloner[] = [
  clonePrimitive,
  cloneWrapper,
  cloneArray,
  cloneCustom,
  cloneSet,
  cloneMap,
  cloneObject,
];

const refs = Symbol('refs');

export function clone<T>(val: T, opts?: CloneOpts & { [refs]?: Map<any, any> }): T {
  // Run custom
  if (opts?.clone) {
    try {
      const res = opts.clone(val, {
        ...opts,
        skip,
      });
      return res as T;
    } catch (e) {
      if (e !== SKIP) throw e;
    }
  }

  // Run through default handlers
  for (let i = 0; i < defaultCloners.length; i++) {
    const cloner = defaultCloners[i];
    try {
      const res = cloner(val, {
        ...opts,
        skip,
      });
      return res as T;
    } catch (e) {
      if (e !== SKIP) throw e;
    }
  }

  // non-supported objects land here and will return unmodified
  return val;
}

function clonePrimitive<T extends Exclude<unknown, 'object'>>(val: T, opts: WithSkip<CloneOpts>): T {
  if (val === null) return null as T;
  if (val === undefined) return undefined as T;
  if (val instanceof Function) return val;
  if (val instanceof Error) return val;

  if (typeof val === 'object') opts.skip();
  return val;
}

function cloneArray<T extends Array<unknown>>(val: T, opts: WithSkip<CloneOpts>): T {
  if (!Array.isArray(val)) opts.skip();
  return val.map(v => clone(v, opts)) as T;
}

function cloneCustom<T extends { clone: Function }>(val: T, opts: WithSkip<CloneOpts>): T {
  if (!('clone' in val) || typeof val.clone !== 'function') opts.skip();
  return val.clone() as T;
}

function cloneWrapper<
  T extends
    | String
    | Number
    | Boolean
    | BigInt
    | Symbol
    | Date
    | RegExp
    | Uint8Array
    | Uint16Array
    | Uint32Array
    | Float32Array
    | Float64Array
    | DataView,
>(val: T, opts: WithSkip<CloneOpts>): T {
  if (
    !(val instanceof String) &&
    !(val instanceof Number) &&
    !(val instanceof Boolean) &&
    !(val instanceof BigInt) &&
    !(val instanceof Symbol) &&
    !(val instanceof Date) &&
    !(val instanceof RegExp) &&
    !(val instanceof Uint8Array) &&
    !(val instanceof Uint16Array) &&
    !(val instanceof Uint32Array) &&
    !(val instanceof Float32Array) &&
    !(val instanceof Float64Array) &&
    !(val instanceof DataView)
  )
    opts.skip();
  return structuredClone(val);
}

function cloneSet<T extends Set<unknown>>(val: T, opts: WithSkip<CloneOpts>): T {
  if (!(val instanceof Set)) opts.skip();
  return new Set([...val].map(value => clone(value, opts))) as T;
}

function cloneMap<T extends Map<unknown, unknown>>(val: T, opts: WithSkip<CloneOpts>): T {
  if (!(val instanceof Map)) opts.skip();
  return new Map([...val].map(([k, v]) => [clone(k, opts), clone(v, opts)])) as T;
}

function cloneObject<T extends object>(val: T, opts: WithSkip<CloneOpts> & { [refs]?: Map<T, T> }): T {
  if (typeof val !== 'object') opts.skip();

  if (!opts[refs]) opts[refs] = new Map();
  const ref = opts[refs]?.get(val);
  if (typeof ref !== 'undefined') return ref;

  const cloned = Object.assign({}, val);
  Object.setPrototypeOf(cloned, Object.getPrototypeOf(val));

  opts[refs].set(val, cloned);

  Object.getOwnPropertyNames(val).forEach(k => {
    cloned[k as never] = clone(val[k as never], opts);
  });
  Object.getOwnPropertySymbols(val).forEach(k => {
    cloned[k as never] = clone(val[k as never], opts);
  });

  return cloned;
}
