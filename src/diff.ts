import { maximizeOp, Mini, minifyOp, Op, Patch } from './patch.js';
import { Pointer } from './pointer.js';
import {
  clone,
  CreateOpts,
  Differ,
  DiffOpts,
  eq,
  eqArray,
  eqMap,
  eqNullable,
  eqObject,
  eqPrimitive,
  eqSet,
  eqWrapper,
  SKIP,
  skip,
  WithSkip,
} from './utils/index.js';

const defaultDiffers: Differ[] = [diffFunction, diffPrimitive, diffArray, diffWrapper, diffSet, diffMap, diffObject];

export function diff(input: unknown, output: unknown, ptr: Pointer, opts: DiffOpts): Patch {
  // Are they equal, then return empty diff
  if (eq(input, output, opts)) return [];

  // Handle a not instance of b
  try {
    return clone(
      diffNullable(input, output, ptr, {
        ...opts,
        skip,
      }),
      opts
    );
  } catch (e) {
    if (e !== SKIP) throw e;
  }

  // Run custom
  if (opts?.diff) {
    try {
      return clone(
        opts.diff(input, output, ptr, {
          ...opts,
          skip,
        }),
        opts
      );
    } catch (e) {
      if (e !== SKIP) throw e;
    }
  }

  // Run through default handlers
  for (const differ of defaultDiffers) {
    try {
      return clone(
        differ(input, output, ptr, {
          ...opts,
          skip,
        }),
        opts
      );
    } catch (e) {
      if (e !== SKIP) throw e;
    }
  }

  // Still don't know the type so just do a full replacement
  return [['~', ptr, clone(output, opts)]];
}

/**
 * If one side is nullish then we immediately know the most optimal solution
 */
function diffNullable(input: unknown, output: unknown, ptr: Pointer, opts: WithSkip<DiffOpts>): Patch {
  if (eqNullable(input, output, opts)) return [];

  if (input === undefined) return [['+', ptr, output]];
  if (output === undefined) return [['-', ptr]];

  return [['~', ptr, output]];
}

/**
 * While functions are a primitive, we handle them extra specially,
 * because mongo is able to store user functions,
 * so we enable comparisons between these by using BSON serialization of functions
 */
function diffFunction(input: object, output: object, ptr: Pointer, opts: WithSkip<DiffOpts>): Patch {
  if (!(typeof input === 'object' && 'diff' in input && typeof input.diff === 'function')) opts.skip();

  return (input as any).diff(output, ptr, opts);
}

/**
 * Compare two primitive types
 */
function diffPrimitive(input: unknown, output: unknown, ptr: Pointer, opts: WithSkip<DiffOpts>): Patch {
  return eqPrimitive(input, output, opts) ? [] : [['~', ptr, output]];
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
 * TODO:
 *  - Add support for move (alias for remove and add)
 *  - Add support for sub index mutations
 */
function diffArray(input: Array<unknown>, output: Array<unknown>, ptr: Pointer, opts: WithSkip<CreateOpts>): Patch {
  if (eqArray(input, output, opts)) return [];

  function getCost(x: Op) {
    if (opts.transform === 'minify') x = minifyOp(x);
    if (opts.transform === 'maximize') x = maximizeOp(x);
    return JSON.stringify(x).length;
  }

  const inputSize = input.length;
  const outputSize = output.length;

  const dp: number[][] = Array.from({ length: inputSize + 1 }, () =>
    Array.from({ length: outputSize + 1 }, () => Infinity)
  );
  const ops: (Mini.Op | null)[][] = Array.from({ length: inputSize + 1 }, () =>
    Array.from({ length: outputSize + 1 }, () => null)
  );

  // Base cases
  dp[0][0] = 0;

  // Fill the DP table
  for (let inputIndex = 0; inputIndex <= inputSize; inputIndex++) {
    for (let outputIndex = 0; outputIndex <= outputSize; outputIndex++) {
      // Equality check
      if (inputIndex < inputSize && outputIndex < outputSize && eq(input[inputIndex], output[outputIndex], opts)) {
        if (dp[inputIndex + 1][outputIndex + 1] > dp[inputIndex][outputIndex]) {
          dp[inputIndex + 1][outputIndex + 1] = dp[inputIndex][outputIndex];
          ops[inputIndex + 1][outputIndex + 1] = null;
        }
      }

      // Add
      if (outputIndex < outputSize) {
        const op: Mini.Op = ['+', ptr.extend(inputIndex), output[outputIndex]];
        const cost = dp[inputIndex][outputIndex] + getCost(op);
        if (cost < dp[inputIndex][outputIndex + 1]) {
          dp[inputIndex][outputIndex + 1] = cost;
          ops[inputIndex][outputIndex + 1] = op;
        }
      }

      // Remove
      if (inputIndex < inputSize) {
        const op: Mini.Op = ['-', ptr.extend(inputIndex)];
        const cost = dp[inputIndex][outputIndex] + getCost(op);
        if (cost < dp[inputIndex + 1][outputIndex]) {
          dp[inputIndex + 1][outputIndex] = cost;
          ops[inputIndex + 1][outputIndex] = op;
        }
      }

      // Replace
      if (inputIndex < inputSize && outputIndex < outputSize) {
        const op: Mini.Op = ['~', ptr.extend(inputIndex), output[outputIndex]];
        const cost = dp[inputIndex][outputIndex] + getCost(op);
        if (cost < dp[inputIndex + 1][outputIndex + 1]) {
          dp[inputIndex + 1][outputIndex + 1] = cost;
          ops[inputIndex + 1][outputIndex + 1] = op;
        }
      }

      // Copy
      if (outputIndex < outputSize) {
        for (let k = 0; k < inputIndex; k++) {
          if (eq(input[k], output[outputIndex], opts)) {
            const op: Mini.Op = ['^', ptr.extend(k), ptr.extend(outputIndex)];
            const cost = dp[inputIndex][outputIndex] + getCost(op);
            if (cost < dp[inputIndex][outputIndex + 1]) {
              dp[inputIndex][outputIndex + 1] = cost;
              ops[inputIndex][outputIndex + 1] = op;
            }
          }
        }
      }

      // Replace Entire Array
      if (inputIndex < inputSize && outputIndex < outputSize) {
        const replaceArrayOp: Mini.Op = ['~', ptr, output.slice(0, outputIndex + 1)];
        const replaceArrayCost = getCost(replaceArrayOp);
        if (replaceArrayCost < dp[inputIndex][outputIndex]) {
          dp[inputIndex + 1][outputIndex + 1] = replaceArrayCost;
          ops[inputIndex + 1][outputIndex + 1] = replaceArrayOp;
        }
      }
    }
  }

  // Backtrack to get the operations list
  const operations: Patch = [];

  for (let inputIndex = inputSize, outputIndex = outputSize; inputIndex > 0 || outputIndex > 0; ) {
    const op = ops[inputIndex][outputIndex];
    if (op) {
      if (op[0] === '+') {
        // Changes to the array shape need to be appended rather than prepended
        operations.push(op);
        outputIndex--;
      } else if (op[0] === '-') {
        operations.unshift(op);
        inputIndex--;
      } else if (op[0] === '~') {
        if (op[1] === ptr) {
          operations.unshift(op);
          // Early termination since we replaced the entire array
          return operations;
        }
        operations.push(op);
        inputIndex--;
        outputIndex--;
      } else if (op[0] === '^') {
        operations.unshift(op);
        outputIndex--;
      }
    } else {
      inputIndex--;
      outputIndex--;
    }
  }

  return operations;
}

function diffWrapper(input: object, output: object, ptr: Pointer, opts: WithSkip<DiffOpts>): Patch {
  return eqWrapper(input, output, opts) ? [] : [['~', ptr, output]];
}

function diffSet(input: Set<unknown>, output: Set<unknown>, ptr: Pointer, opts: WithSkip<DiffOpts>): Patch {
  return eqSet(input, output, opts) ? [] : [['~', ptr, output]];
}

const inputSeen = Symbol('input-seen');
const outputSeen = Symbol('output-seen');

function diffMap(
  input: Map<any, any>,
  output: Map<any, any>,
  ptr: Pointer,
  opts: WithSkip<DiffOpts> & { [inputSeen]?: any[]; [outputSeen]?: any[] }
): Patch {
  if (eqMap(input, output, opts)) return [];

  const ops: Patch = [];

  // If recursion occurs then force a full replacement and let the user handle serializing it
  let length = opts[inputSeen]?.length ?? 0;
  while (opts[inputSeen] && opts[outputSeen] && length--) {
    if (opts[inputSeen][length] === input || opts[outputSeen][length] === output) return [['~', ptr, output]];
  }

  if (!opts[inputSeen]) opts[inputSeen] = [];
  opts[inputSeen].push(input);
  if (!opts[outputSeen]) opts[outputSeen] = [];
  opts[outputSeen].push(input);

  // Check for updates on existing keys, this covers both Update and Deletion due to undefined checks
  for (const key of input.keys()) {
    ops.push(...diff(input.get(key), output.get(key), ptr.extend(key), opts));
  }

  // Find keys that are in the output but not in the input (Addition)
  for (const key of output.keys()) {
    if (!input.has(key)) ops.push(...diff(undefined, output.get(key), ptr.extend(key), opts));
  }

  opts[inputSeen].pop();
  opts[outputSeen].pop();

  return ops;
}

/**
 * Compares two objects
 *
 * Recursively iterating over all object keys and symbols
 *
 * Handles circular references
 */
function diffObject(
  input: object,
  output: object,
  ptr: Pointer,
  opts: WithSkip<DiffOpts> & { [inputSeen]?: any[]; [outputSeen]?: any[] }
): Patch {
  if (eqObject(input, output, opts)) return [];

  const ops: Patch = [];

  // If recursion occurs then force a full replacement and let the user handle serializing it
  let length = opts[inputSeen]?.length ?? 0;
  while (opts[inputSeen] && opts[outputSeen] && length--) {
    if (opts[inputSeen][length] === input || opts[outputSeen][length] === output) return [['~', ptr, output]];
  }

  if (!opts[inputSeen]) opts[inputSeen] = [];
  opts[inputSeen].push(input);
  if (!opts[outputSeen]) opts[outputSeen] = [];
  opts[outputSeen].push(input);

  // Check for updates on existing keys, this covers both Update and Deletion due to undefined checks
  for (const key of Object.keys(input)) {
    ops.push(...diff(input[key as never], output[key as never], ptr.extend(key), opts));
  }
  for (const key of Object.getOwnPropertySymbols(input)) {
    ops.push(...diff(input[key as never], output[key as never], ptr.extend(key), opts));
  }

  // Find keys that are in the output but not in the input (Addition)
  for (const key of Object.keys(output)) {
    if (!(key in input)) ops.push(...diff(undefined, output[key as never], ptr.extend(key), opts));
  }
  for (const key of Object.getOwnPropertySymbols(output)) {
    if (!(key in input)) ops.push(...diff(undefined, output[key as never], ptr.extend(key), opts));
  }

  opts[inputSeen].pop();
  opts[outputSeen].pop();

  return ops;
}
