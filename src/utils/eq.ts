import { EqFunc, EqOpts, SKIP, skip, WithSkip } from './types';

const defaultEqFunc: EqFunc[] = [eqFunction, eqPrimitive, eqArray, eqWrapper, eqSet, eqMap, eqObject];

export function eq(x: any, y: any, opts: EqOpts): boolean {
  // Shortcut pointer equality check
  if (Object.is(x, y)) return true;

  // Handle a not instance of b
  try {
    return eqNullable(x, y, {
      ...opts,
      skip,
    });
  } catch (e) {
    if (e !== SKIP) throw e;
  }

  // Run custom
  if (opts.eq) {
    try {
      return opts.eq(x, y, {
        ...opts,
        skip,
      });
    } catch (e) {
      if (e !== SKIP) throw e;
    }
  }

  // Run through default handlers
  for (const eqFunc of defaultEqFunc) {
    try {
      return eqFunc(x, y, {
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
export function eqNullable(x: unknown, y: unknown, opts: WithSkip<EqOpts>): boolean {
  if (x === undefined && y === undefined) return true;
  if (x === undefined && y !== undefined) return false;
  if (x !== undefined && y === undefined) return false;

  if (x === null && y === null) return true;
  if (x === null && y !== null) return false;
  if (x !== null && y === null) return false;

  opts.skip();
}

export function eqFunction(x: unknown, y: unknown, opts: WithSkip<EqOpts>): boolean {
  if (!!x && typeof x === 'object') {
    if ('eq' in x && typeof x.eq === 'function') return x.eq(y);
    if ('isEqual' in x && typeof x.isEqual === 'function') return x.isEqual(y);
    if ('equal' in x && typeof x.equal === 'function') return x.equal(y);
    if ('equals' in x && typeof x.equals === 'function') return x.equals(y);
  }

  const asymmetricX = !!x && typeof x === 'object' && 'asymmetricMatch' in x && typeof x.asymmetricMatch === 'function';
  if (asymmetricX) {
    if ((x.asymmetricMatch as Function)(y)) return true;
  }

  const asymmetricY = !!y && typeof y === 'object' && 'asymmetricMatch' in y && typeof y.asymmetricMatch === 'function';
  if (asymmetricY) {
    if ((y.asymmetricMatch as Function)(x)) return true;
  }

  if (!asymmetricX && !asymmetricY) opts.skip();
  return false;
}

export function eqPrimitive(x: unknown, y: unknown, opts: WithSkip<EqOpts>): boolean {
  if (typeof x !== typeof y) return false;

  // Objects are handled separately
  if (typeof x === 'object') opts.skip();

  return Object.is(x, y);
}

export function eqArray(x: unknown, y: unknown, opts: WithSkip<EqOpts>): boolean {
  if (!Array.isArray(x) && !Array.isArray(y)) opts.skip();
  if (Array.isArray(x) && Array.isArray(y)) {
    return x.length === y.length && x.every((v: any, k: number) => eq(v, y[k], opts));
  }
  return false;
}

export function eqWrapper(x: object, y: object, opts: WithSkip<EqOpts>): boolean {
  if (x instanceof Error && y instanceof Error) return x.message === y.message;
  if (x instanceof String && y instanceof String) return x.valueOf() === y.valueOf();
  if (x instanceof Number && y instanceof Number) return x.valueOf() === y.valueOf();
  if (x instanceof Boolean && y instanceof Boolean) return x.valueOf() === y.valueOf();
  if (x instanceof Date && y instanceof Date) return x.getTime() === y.getTime();
  if (x instanceof RegExp && y instanceof RegExp) return x.source === y.source && x.flags === y.flags;
  if (x instanceof Int8Array && y instanceof Int8Array) return x.length === y.length && !x.some((v, i) => v !== y[i]);
  if (x instanceof Int16Array && y instanceof Int16Array) return x.length === y.length && !x.some((v, i) => v !== y[i]);
  if (x instanceof Int32Array && y instanceof Int32Array) return x.length === y.length && !x.some((v, i) => v !== y[i]);
  if (x instanceof Uint8Array && y instanceof Uint8Array) return x.length === y.length && !x.some((v, i) => v !== y[i]);
  if (x instanceof Uint8ClampedArray && y instanceof Uint8ClampedArray) {
    return x.length === y.length && !x.some((v, i) => v !== y[i]);
  }
  if (x instanceof Uint16Array && y instanceof Uint16Array) {
    return x.length === y.length && !x.some((v, i) => v !== y[i]);
  }
  if (x instanceof Uint32Array && y instanceof Uint32Array) {
    return x.length === y.length && !x.some((v, i) => v !== y[i]);
  }
  if (x instanceof Float32Array && y instanceof Float32Array) {
    return x.length === y.length && !x.some((v, i) => v !== y[i]);
  }
  if (x instanceof Float64Array && y instanceof Float64Array) {
    return x.length === y.length && !x.some((v, i) => v !== y[i]);
  }
  if (x instanceof ArrayBuffer && y instanceof ArrayBuffer) {
    if (x.byteLength !== y.byteLength) return false;
    const xTyped = new Int8Array(x);
    const yTyped = new Int8Array(y);
    return !xTyped.some((v, i) => v !== yTyped[i]);
  }
  if (x instanceof DataView && y instanceof DataView) {
    if (x.byteLength !== y.byteLength) return false;
    if (x.byteOffset !== y.byteOffset) return false;
    const xTyped = new Int8Array(x.buffer);
    const yTyped = new Int8Array(y.buffer);
    return !xTyped.some((v, i) => v !== yTyped[i]);
  }

  opts.skip();
}

export function eqSet(x: object, y: object, opts: WithSkip<EqOpts>): boolean {
  if (x instanceof Set && y instanceof Set) {
    if (x.size !== y.size) return false;

    const xVals = [...x.values()];
    const yVals = [...y.values()];

    return xVals.every(xVal => yVals.some(yVal => eq(xVal, yVal, opts)));
  }
  if (!(x instanceof Set) && !(y instanceof Set)) opts.skip();
  return false;
}

export function eqMap(x: object, y: object, opts: WithSkip<EqOpts>): boolean {
  if (x instanceof Map && y instanceof Map) {
    if (x.size !== y.size) return false;

    return [...x.entries()].every(([k, xVal]) => eq(xVal, y.get(k), opts));
  }
  if (!(x instanceof Map) && !(y instanceof Map)) opts.skip();
  return false;
}

const xSeen = Symbol('x-seen');
const ySeen = Symbol('y-seen');

export function eqObject(x: object, y: object, opts: WithSkip<EqOpts> & { [xSeen]?: any[]; [ySeen]?: any[] }): boolean {
  // if they are not the same type we cant compare them
  if (Object.getPrototypeOf(x) !== Object.getPrototypeOf(y)) opts.skip();

  let length = opts[xSeen]?.length ?? 0;
  while (opts[xSeen] && opts[ySeen] && length--) {
    if (opts[xSeen][length] === x) return opts[ySeen][length] === y;
    else if (opts[ySeen][length] === y) return false;
  }

  if (!opts[xSeen]) opts[xSeen] = [];
  opts[xSeen].push(x);
  if (!opts[ySeen]) opts[ySeen] = [];
  opts[ySeen].push(y);

  let res = true;
  const xKeys = Object.keys(x);
  if (!eq(new Set(xKeys), new Set(Object.keys(y)), opts)) res = false;
  if (res && xKeys.some(k => !eq(x[k as never], y[k as never], opts))) res = false;

  if (res) {
    const xSymbols = Object.getOwnPropertySymbols(x);
    if (!eq(new Set(xSymbols), new Set(Object.getOwnPropertySymbols(y)), opts)) res = false;
    if (xSymbols.some(k => !eq(x[k as never], y[k as never], opts))) res = false;
  }

  opts[xSeen].pop();
  opts[ySeen].pop();
  return res;
}
