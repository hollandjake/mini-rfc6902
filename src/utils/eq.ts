import { EqFunc, EqOpts, SKIP, skip, WithSkip } from './types';

const defaultEqFunc: EqFunc[] = [eqCustom, eqPrimitive, eqWrapper, eqArray, eqSet, eqMap, eqObject];

/**
 * Returns whether the two passed arguments are equal
 *
 * @param a - left hand side of the equality comparison
 * @param b - right hand side of the equality comparison
 * @param opts - options for custom handling
 */
export function eq(a: any, b: any, opts?: EqOpts): boolean {
  // Shortcut pointer equality check
  if (Object.is(a, b)) return true;

  // Handle a not instance of b
  try {
    return eqNullable(a, b, {
      ...opts,
      skip,
    });
  } catch (e) {
    if (e !== SKIP) throw e;
  }

  // Run custom
  if (opts?.eq) {
    try {
      return opts.eq(a, b, {
        ...opts,
        skip,
      });
    } catch (e) {
      if (e !== SKIP) throw e;
    }
  }

  // Run through default handlers
  for (let i = 0; i < defaultEqFunc.length; i++) {
    try {
      return defaultEqFunc[i](a, b, {
        ...opts,
        skip,
      });
    } catch (e) {
      if (e !== SKIP) throw e;
    }
  }

  // If everything fails through then return false
  return false;
}

/**
 * If one side is nullable and the other doesn't match then we immediately know they don't equal
 *
 * This allows all the other functions to not have to deal with nullables
 */
export function eqNullable(a: unknown, b: unknown, opts: WithSkip<EqOpts>): boolean {
  if (a === undefined && b === undefined) return true;
  if (a === undefined && b !== undefined) return false;
  if (a !== undefined && b === undefined) return false;

  if (a === null && b === null) return true;
  if (a === null && b !== null) return false;
  if (a !== null && b === null) return false;

  opts.skip();
}

/**
 * Check if any equality functions exist and if so use them
 */
export function eqCustom(a: unknown, b: unknown, opts: WithSkip<EqOpts>): boolean {
  if (!!a && typeof a === 'object') {
    if ('eq' in a && typeof a.eq === 'function') return a.eq(b);
    if ('isEqual' in a && typeof a.isEqual === 'function') return a.isEqual(b);
    if ('equal' in a && typeof a.equal === 'function') return a.equal(b);
    if ('equals' in a && typeof a.equals === 'function') return a.equals(b);
  }

  const asymmetricA = !!a && typeof a === 'object' && 'asymmetricMatch' in a && typeof a.asymmetricMatch === 'function';
  if (asymmetricA) {
    if ((a.asymmetricMatch as Function)(b)) return true;
  }

  const asymmetricB = !!b && typeof b === 'object' && 'asymmetricMatch' in b && typeof b.asymmetricMatch === 'function';
  if (asymmetricB) {
    if ((b.asymmetricMatch as Function)(a)) return true;
  }

  if (!asymmetricA && !asymmetricB) opts.skip();
  return false;
}

/**
 * Check equality of js primitives
 */
export function eqPrimitive(a: unknown, b: unknown, opts: WithSkip<EqOpts>): boolean {
  if (typeof a !== typeof b) return false;

  // Objects are handled separately
  if (typeof a === 'object') opts.skip();

  return Object.is(a, b);
}
/**
 * Check equality of js array
 */
export function eqArray(a: unknown, b: unknown, opts: WithSkip<EqOpts>): boolean {
  if (!Array.isArray(a) && !Array.isArray(b)) opts.skip();
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v: any, k: number) => eq(v, b[k], opts));
  }
  return false;
}

/**
 * Check equality of js wrappers
 */
export function eqWrapper(a: object, b: object, opts: WithSkip<EqOpts>): boolean {
  if (a instanceof Error && b instanceof Error) return a.message === b.message;
  if (a instanceof String && b instanceof String) return a.valueOf() === b.valueOf();
  if (a instanceof Number && b instanceof Number) return a.valueOf() === b.valueOf();
  if (a instanceof Boolean && b instanceof Boolean) return a.valueOf() === b.valueOf();
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp && b instanceof RegExp) return a.source === b.source && a.flags === b.flags;
  if (a instanceof Int8Array && b instanceof Int8Array) return a.length === b.length && !a.some((v, i) => v !== b[i]);
  if (a instanceof Int16Array && b instanceof Int16Array) return a.length === b.length && !a.some((v, i) => v !== b[i]);
  if (a instanceof Int32Array && b instanceof Int32Array) return a.length === b.length && !a.some((v, i) => v !== b[i]);
  if (a instanceof Uint8Array && b instanceof Uint8Array) return a.length === b.length && !a.some((v, i) => v !== b[i]);
  if (a instanceof Uint8ClampedArray && b instanceof Uint8ClampedArray) {
    return a.length === b.length && !a.some((v, i) => v !== b[i]);
  }
  if (a instanceof Uint16Array && b instanceof Uint16Array) {
    return a.length === b.length && !a.some((v, i) => v !== b[i]);
  }
  if (a instanceof Uint32Array && b instanceof Uint32Array) {
    return a.length === b.length && !a.some((v, i) => v !== b[i]);
  }
  if (a instanceof Float32Array && b instanceof Float32Array) {
    return a.length === b.length && !a.some((v, i) => v !== b[i]);
  }
  if (a instanceof Float64Array && b instanceof Float64Array) {
    return a.length === b.length && !a.some((v, i) => v !== b[i]);
  }
  if (a instanceof ArrayBuffer && b instanceof ArrayBuffer) {
    if (a.byteLength !== b.byteLength) return false;
    const aTyped = new Int8Array(a);
    const bTyped = new Int8Array(b);
    return !aTyped.some((v, i) => v !== bTyped[i]);
  }
  if (a instanceof DataView && b instanceof DataView) {
    if (a.byteLength !== b.byteLength) return false;
    if (a.byteOffset !== b.byteOffset) return false;
    const aTyped = new Int8Array(a.buffer);
    const bTyped = new Int8Array(b.buffer);
    return !aTyped.some((v, i) => v !== bTyped[i]);
  }

  opts.skip();
}

/**
 * Check equality of js Set
 */
export function eqSet(a: object, b: object, opts: WithSkip<EqOpts>): boolean {
  if (!(a instanceof Set) && !(b instanceof Set)) opts.skip();
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;

    const aVals = [...a.values()];
    const bVals = [...b.values()];

    return aVals.every(aVal => bVals.some(bVal => eq(aVal, bVal, opts)));
  }
  return false;
}

/**
 * Check equality of js Map
 */
export function eqMap(a: object, b: object, opts: WithSkip<EqOpts>): boolean {
  if (!(a instanceof Map) && !(b instanceof Map)) opts.skip();
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;

    return [...a.entries()].every(([k, aVal]) => eq(aVal, b.get(k), opts));
  }
  return false;
}

const aSeen = Symbol('a-seen');
const bSeen = Symbol('b-seen');

/**
 * Check equality of js objects
 */
export function eqObject(a: object, b: object, opts: WithSkip<EqOpts> & { [aSeen]?: any[]; [bSeen]?: any[] }): boolean {
  // if they are not the same type we cant compare them
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) opts.skip();

  let length = opts[aSeen]?.length ?? 0;
  while (opts[aSeen] && opts[bSeen] && length--) {
    if (opts[aSeen][length] === a) return opts[bSeen][length] === b;
    else if (opts[bSeen][length] === b) return false;
  }

  if (!opts[aSeen]) opts[aSeen] = [];
  opts[aSeen].push(a);
  if (!opts[bSeen]) opts[bSeen] = [];
  opts[bSeen].push(b);

  let res = true;
  const aKeys = Object.keys(a);
  if (!eq(new Set(aKeys), new Set(Object.keys(b)), opts)) res = false;
  if (res && aKeys.some(k => !eq(a[k as never], b[k as never], opts))) res = false;

  if (res) {
    const aSymbols = Object.getOwnPropertySymbols(a);
    if (!eq(new Set(aSymbols), new Set(Object.getOwnPropertySymbols(b)), opts)) res = false;
    if (aSymbols.some(k => !eq(a[k as never], b[k as never], opts))) res = false;
  }

  opts[aSeen].pop();
  opts[bSeen].pop();
  return res;
}
