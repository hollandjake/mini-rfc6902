import { Maxi, maximize, Mini, Patch } from './patch';
import { Pointer, RootPointer } from './pointer';
import { AnyArray, clone, eq, serialize } from './utils';

export function create(a: unknown, b: unknown): Maxi.Patch | null;
export function create(a: unknown, b: unknown, minify: true): Mini.Patch | null;
export function create(a: unknown, b: unknown, minify?: true): Patch | null {
  const patch = diff(a, b);
  if (patch.length === 0) return null;

  if (!minify) return maximize(patch);
  return patch;
}

type DiffCalc<T> = (a: T, b: T, ptr: Pointer) => Mini.Patch | undefined;

const DiffCalcs: DiffCalc<never>[] = [diffNullable, diffDate, diffArray, diffObject, diffFunctions, diffPrimitive];

export function diff(a: unknown, b: unknown, ptr: Pointer = RootPointer): Mini.Patch {
  for (const calc of DiffCalcs) {
    const res = calc(a as never, b as never, ptr);
    if (res) return res;
  }

  // If there is still no result then the types are totally different,
  // and so they cant be split into smaller sub patches and instead are a full replacement
  // We don't actually care about the value we just want to know if they are different pointers
  if (a !== b) return [['~', ptr, clone(b)]];
  return [];
}

/**
 * If one side is nullable then we immediately know the most optimal solution is to add or delete
 */
function diffNullable(a: null | undefined, b: null | undefined, ptr: Pointer): Mini.Patch | undefined {
  if (!(a === null || a === undefined) && !(b === null || b === undefined)) return undefined;

  if (a === undefined && b === undefined) return [];
  if (a === null && b === null) return [];

  if (a === undefined && b !== undefined) return [['+', ptr, clone(b)]];
  if (a !== undefined && b === undefined) return [['-', ptr]];

  return [['~', ptr, clone(b)]];
}

/**
 * While functions are a primitive, we handle them extra specially,
 * because mongo is able to store user functions,
 * so we enable comparisons between these by using BSON serialization of functions
 */
function diffFunctions(a: Function, b: Function, ptr: Pointer): Mini.Patch | undefined {
  if (typeof a !== 'function' || typeof b !== 'function') return undefined;

  return eq(a, b) ? [] : [['~', ptr, clone(b)]];
}

/**
 * Compare two primitive types
 *
 * Making sure to handle NaN correctly, NaN === NaN
 */
function diffPrimitive(a: Exclude<unknown, object>, b: Exclude<unknown, object>, ptr: Pointer): Mini.Patch | undefined {
  if (typeof a === 'object' || typeof b === 'object') return undefined;

  // Special case for NaN
  if (Number.isNaN(a) && Number.isNaN(b)) return [];

  return a !== b ? [['~', ptr, clone(b)]] : [];
}

/**
 * Create a Mini.mal operation set to transform array a into b
 *
 * This is achieved through the use of an Edit Distance algorithm with supported operations:
 * > add
 * > remove
 * > replace
 * > copy
 * > replace array
 *
 * TODO: Add support for move (alias for remove and add)
 */
function diffArray(a: AnyArray, b: AnyArray, ptr: Pointer): Mini.Patch | undefined {
  if (!Array.isArray(a) || !Array.isArray(b)) return undefined;

  // Shortcut check for deep equality, if anything is different then we proceed
  if (eq(a, b)) return [];

  const getCost = (x: unknown) => serialize(x).length;

  const aSize = a.length;
  const bSize = b.length;

  const dp: number[][] = Array.from({ length: aSize + 1 }, () => Array.from({ length: bSize + 1 }, () => Infinity));
  const ops: (Mini.Op | null)[][] = Array.from({ length: aSize + 1 }, () =>
    Array.from({ length: bSize + 1 }, () => null)
  );

  // Base cases
  dp[0][0] = 0;

  // Fill the DP table
  for (let aIndex = 0; aIndex <= aSize; aIndex++) {
    for (let bIndex = 0; bIndex <= bSize; bIndex++) {
      // Equality check
      if (aIndex < aSize && bIndex < bSize && eq(a[aIndex], b[bIndex])) {
        if (dp[aIndex + 1][bIndex + 1] > dp[aIndex][bIndex]) {
          dp[aIndex + 1][bIndex + 1] = dp[aIndex][bIndex];
          ops[aIndex + 1][bIndex + 1] = null;
        }
      }

      // Add
      if (bIndex < bSize) {
        const op: Mini.Op = ['+', ptr.extend(aIndex), b[bIndex]];
        const cost = dp[aIndex][bIndex] + getCost(op);
        if (cost < dp[aIndex][bIndex + 1]) {
          dp[aIndex][bIndex + 1] = cost;
          ops[aIndex][bIndex + 1] = op;
        }
      }

      // Remove
      if (aIndex < aSize) {
        const op: Mini.Op = ['-', ptr.extend(aIndex)];
        const cost = dp[aIndex][bIndex] + getCost(op);
        if (cost < dp[aIndex + 1][bIndex]) {
          dp[aIndex + 1][bIndex] = cost;
          ops[aIndex + 1][bIndex] = op;
        }
      }

      // Replace
      if (aIndex < aSize && bIndex < bSize) {
        const op: Mini.Op = ['~', ptr.extend(aIndex), b[bIndex]];
        const cost = dp[aIndex][bIndex] + getCost(op);
        if (cost < dp[aIndex + 1][bIndex + 1]) {
          dp[aIndex + 1][bIndex + 1] = cost;
          ops[aIndex + 1][bIndex + 1] = op;
        }
      }

      // Copy
      if (bIndex < bSize) {
        for (let k = 0; k < aIndex; k++) {
          if (eq(a[k], b[bIndex])) {
            const op: Mini.Op = ['^', ptr.extend(k), ptr.extend(bIndex)];
            const cost = dp[aIndex][bIndex] + getCost(op);
            if (cost < dp[aIndex][bIndex + 1]) {
              dp[aIndex][bIndex + 1] = cost;
              ops[aIndex][bIndex + 1] = op;
            }
          }
        }
      }

      // Replace Entire Array
      if (aIndex < aSize && bIndex < bSize) {
        const replaceArrayOp: Mini.Op = ['~', ptr, b.slice(0, bIndex + 1)];
        const replaceArrayCost = getCost(replaceArrayOp);
        if (replaceArrayCost < dp[aIndex][bIndex]) {
          dp[aIndex + 1][bIndex + 1] = replaceArrayCost;
          ops[aIndex + 1][bIndex + 1] = replaceArrayOp;
        }
      }
    }
  }

  // Backtrack to get the operations list
  const operations: Mini.Patch = [];

  for (let i = aSize, j = bSize; i > 0 || j > 0; ) {
    const op = ops[i][j];
    if (op) {
      if (op[0] === '+') {
        operations.unshift(['+', op[1], clone(op[2])]);
        j--;
      } else if (op[0] === '-') {
        operations.unshift(['-', ptr.extend(i - 1)]);
        i--;
      } else if (op[0] === '~') {
        if (op[1] === ptr) {
          operations.unshift(['~', ptr, clone(op[2])]);
          // Early termination since we replaced the entire array
          return operations;
        }
        operations.unshift(['~', ptr.extend(i - 1), clone(op[2])]);
        i--;
        j--;
      } else if (op[0] === '>') {
        operations.unshift(['>', op[1], op[2]]);
        i--;
      } else if (op[0] === '^') {
        operations.unshift(['^', op[1], op[2]]);
        j--;
      }
    } else {
      i--;
      j--;
    }
  }

  return operations;
}

/**
 * Compares two objects
 */
function diffObject(a: object, b: object, ptr: Pointer): Mini.Patch | undefined {
  if (typeof a !== 'object' || typeof b !== 'object') return undefined;

  // Quick check object
  if (eq(a, b)) return [];

  const ops: Mini.Patch = [];

  // Check for updates on existing keys, this covers both Update and Deletion due to undefined checks
  for (const key of Object.keys(a)) {
    ops.push(...diff(a[key as never], b[key as never], ptr.extend(key)));
  }

  // Find keys that are in the output but not in the input (Addition)
  for (const key of Object.keys(b)) {
    if (!(key in a)) ops.push(...diff(undefined, b[key as never], ptr.extend(key)));
  }

  return ops;
}

function diffDate(a: Date, b: Date, ptr: Pointer): Mini.Patch | undefined {
  if (!(a instanceof Date) || !(b instanceof Date)) return undefined;

  if (a.getTime() !== b.getTime()) return [['~', ptr, clone(b)]];

  return [];
}
