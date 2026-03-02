import {
  type MaxiPatch,
  type Mini,
  type MiniPatch,
  maximizeOp,
  minifyOp,
  type Op,
  type Patch,
  type SerialPatch,
  serializeOp,
} from './patch';
import type { Pointer } from './pointer';
import {
  type CloneOpts,
  type CreateOpts,
  clone,
  type Differ,
  type DiffOpts,
  eq,
  eqArray,
  eqCustom,
  eqMap,
  eqNullable,
  eqObject,
  eqPrimitive,
  eqSet,
  eqWrapper,
  type OptimizeOpts,
  SKIP,
  skip,
  type TransformOpts,
  transform,
  type WithSkip,
} from './utils';

const defaultDiffers: Differ<{}, MiniPatch>[] = [
  diffFunction,
  diffCustom,
  diffPrimitive,
  diffWrapper,
  diffArray,
  diffSet,
  diffMap,
  diffObject,
];

/**
 * Returns a list of operations (a JSON Patch) comprising the operations to transform `input` into `output`.
 * By default, it attempts to produce the smallest patch by size, this does not necessarily mean the smallest
 * impacting operations, sometimes a full replacement may result in fewer bytes but would impact more fields.
 * Use `opts.optimize: 'impact'` to optimize for the least number of fields impacted instead.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * The output will be a {@link MiniPatch} if the user provided {@link Differ} returns a Serialized patch,
 * it will be converted to a {@link MiniPatch} and then combined with the other patches
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 * @param ptr - Pointer representing the current position relative to the input root
 */
export function diff(input: any, output: any, ptr: Pointer): MiniPatch;
/**
 * Returns a list of operations (a JSON Patch) comprised of the operations to transform `input` into `output`.
 * It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
 * as a full replacement may result in more bytes being sent.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * The output will be a {@link MiniPatch} if the user provided {@link Differ} returns a Serialized patch,
 * it will be converted to a {@link MiniPatch} and then combined with the other patches
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 * @param ptr - Pointer representing the current position relative to the input root
 * @param opts - options for custom handling
 * @param opts.transform - force the output to all be minified
 */
export function diff(input: any, output: any, ptr: Pointer, opts: DiffOpts & { transform: 'minify' }): MiniPatch;
/**
 * Returns a list of operations (a JSON Patch) comprised of the operations to transform `input` into `output`.
 * It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
 * as a full replacement may result in more bytes being sent.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * The output will be a {@link MiniPatch} if the user provided {@link Differ} returns a Serialized patch,
 * it will be converted to a {@link MiniPatch} and then combined with the other patches
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 * @param ptr - Pointer representing the current position relative to the input root
 * @param opts - options for custom handling
 * @param opts.transform - force the output to all be maximised
 */
export function diff(input: any, output: any, ptr: Pointer, opts: DiffOpts & { transform: 'maximize' }): MaxiPatch;
/**
 * Returns a list of operations (a JSON Patch) comprised of the operations to transform `input` into `output`.
 * It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
 * as a full replacement may result in more bytes being sent.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * The output will be a {@link SerialPatch} if the user provided {@link Differ} returns a Serialized patch,
 * it will be converted to a {@link MiniPatch} and then combined with the other patches
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 * @param ptr - Pointer representing the current position relative to the input root
 * @param opts - options for custom handling
 * @param opts.transform - force the output to be serialized
 */
export function diff(
  input: unknown,
  output: unknown,
  ptr: Pointer,
  opts: DiffOpts & { transform: 'serialize' },
): SerialPatch;
/**
 * Returns a list of operations (a JSON Patch) comprising the operations to transform `input` into `output`.
 * By default, it attempts to produce the smallest patch by byte size,
 * this does not necessarily mean it impacts the least number of fields,
 * as a full replacement may result in fewer bytes being sent.
 * Use `opts.optimize: 'impact'` to optimize for the least number of fields impacted instead.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * The output will be a {@link Patch} if the user provided {@link Differ} returns a Serialized patch,
 * it will be converted to a {@link MiniPatch} and then combined with the other patches
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 * @param ptr - Pointer representing the current position relative to the input root
 * @param opts - Optional options for custom handling
 */
export function diff(input: unknown, output: unknown, ptr: Pointer, opts: DiffOpts): MiniPatch;

export function diff(input: unknown, output: unknown, ptr: Pointer, opts?: DiffOpts): Patch {
  // Are they equal, then return empty diff
  if (eq(input, output, opts)) return transform([], opts?.transform);

  // Handle a xor b nullable
  try {
    return transform(
      clone(
        diffNullable(input, output, ptr, {
          ...opts,
          skip,
        }),
        opts,
      ),
      opts?.transform,
    );
  } catch (e) {
    if (e !== SKIP) throw e;
  }

  // Run custom
  if (opts?.diff) {
    try {
      return transform(
        clone(
          opts.diff(input, output, ptr, {
            ...opts,
            skip,
          }),
          opts,
        ),
        opts.transform,
      );
    } catch (e) {
      if (e !== SKIP) throw e;
    }
  }

  // Run through default handlers
  for (let i = 0; i < defaultDiffers.length; i++) {
    try {
      let patch = defaultDiffers[i](input, output, ptr, {
        ...opts,
        skip,
      });

      // Could a full replacement be better? if so, let's use that
      patch = checkFullReplace(input, output, ptr, patch, opts);

      return transform(clone(patch, opts), opts?.transform);
    } catch (e) {
      if (e !== SKIP) throw e;
    }
  }

  // Still don't know the type so just do a full replacement
  return transform([['~', ptr, clone(output, opts)]], opts?.transform);
}

/**
 * If one side is nullish then we immediately know the most optimal solution
 */
function diffNullable(input: unknown, output: unknown, ptr: Pointer, opts: WithSkip<DiffOpts>): MiniPatch {
  if (eqNullable(input, output, opts)) return [];

  if (input === undefined) return [['+', ptr, output]];
  if (output === undefined) return [['-', ptr]];

  return [['~', ptr, output]];
}

/**
 * If an input has the ability to generate a diff
 */
function diffFunction(input: object, output: object, ptr: Pointer, opts: WithSkip<DiffOpts>): MiniPatch {
  if (!(typeof input === 'object' && 'diff' in input && typeof input.diff === 'function')) opts.skip();

  return transform((input as any).diff(output, ptr, opts), 'minify');
}

/**
 * If an input has a custom equality method
 */
function diffCustom(input: object, output: object, ptr: Pointer, opts: WithSkip<DiffOpts>): MiniPatch {
  return eqCustom(input, output, opts) ? [] : [['~', ptr, output]];
}

/**
 * Compare two primitive types
 */
function diffPrimitive(input: unknown, output: unknown, ptr: Pointer, opts: WithSkip<DiffOpts>): MiniPatch {
  return eqPrimitive(input, output, opts) ? [] : [['~', ptr, output]];
}

/**
 * Create a {@link MiniPatch} to transform array a into b
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
function diffArray(input: Array<unknown>, output: Array<unknown>, ptr: Pointer, opts: WithSkip<CreateOpts>): MiniPatch {
  if (eqArray(input, output, opts)) return [];

  const inputSize = input.length;
  const outputSize = output.length;

  const dp: number[][] = Array.from({ length: inputSize + 1 }, () =>
    Array.from({ length: outputSize + 1 }, () => Infinity),
  );
  const ops: (Mini.Op | null)[][] = Array.from({ length: inputSize + 1 }, () =>
    Array.from({ length: outputSize + 1 }, () => null),
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
        const cost = dp[inputIndex][outputIndex] + getCost(input[inputIndex], op, opts);
        if (cost < dp[inputIndex][outputIndex + 1]) {
          dp[inputIndex][outputIndex + 1] = cost;
          ops[inputIndex][outputIndex + 1] = op;
        }
      }

      // Remove
      if (inputIndex < inputSize) {
        const op: Mini.Op = ['-', ptr.extend(inputIndex)];
        const cost = dp[inputIndex][outputIndex] + getCost(input[inputIndex], op, opts);
        if (cost < dp[inputIndex + 1][outputIndex]) {
          dp[inputIndex + 1][outputIndex] = cost;
          ops[inputIndex + 1][outputIndex] = op;
        }
      }

      // Replace
      if (inputIndex < inputSize && outputIndex < outputSize) {
        const op: Mini.Op = ['~', ptr.extend(inputIndex), output[outputIndex]];
        const cost = dp[inputIndex][outputIndex] + getCost(input[inputIndex], op, opts);
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
            const cost = dp[inputIndex][outputIndex] + getCost(input[k], op, opts);
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
        const replaceArrayCost = getCost(input, replaceArrayOp, opts);
        if (replaceArrayCost < dp[inputIndex][outputIndex]) {
          dp[inputIndex + 1][outputIndex + 1] = replaceArrayCost;
          ops[inputIndex + 1][outputIndex + 1] = replaceArrayOp;
        }
      }
    }
  }

  // Backtrack to get the operations list
  const operations: MiniPatch = [];

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

function diffWrapper(input: object, output: object, ptr: Pointer, opts: WithSkip<DiffOpts>): MiniPatch {
  return eqWrapper(input, output, opts) ? [] : [['~', ptr, output]];
}

function diffSet(input: Set<unknown>, output: Set<unknown>, ptr: Pointer, opts: WithSkip<DiffOpts>): MiniPatch {
  return eqSet(input, output, opts) ? [] : [['~', ptr, output]];
}

const inputSeen = Symbol('input-seen');
const outputSeen = Symbol('output-seen');

function diffMap(
  input: Map<any, any>,
  output: Map<any, any>,
  ptr: Pointer,
  opts: WithSkip<DiffOpts> & { [inputSeen]?: any[]; [outputSeen]?: any[] },
): MiniPatch {
  if (eqMap(input, output, opts)) return [];

  const ops: MiniPatch = [];

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
    ops.push(...transform(diff(input.get(key), output.get(key), ptr.extend(key), opts), 'minify'));
  }

  // Find keys that are in the output but not in the input (Addition)
  for (const key of output.keys()) {
    if (!input.has(key)) ops.push(...transform(diff(undefined, output.get(key), ptr.extend(key), opts), 'minify'));
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
  opts: WithSkip<DiffOpts> & { [inputSeen]?: any[]; [outputSeen]?: any[] },
): MiniPatch {
  if (eqObject(input, output, opts)) return [];

  const ops: MiniPatch = [];

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
    ops.push(...transform(diff(input[key as never], output[key as never], ptr.extend(key), opts), 'minify'));
  }
  for (const key of Object.getOwnPropertySymbols(input)) {
    ops.push(...transform(diff(input[key as never], output[key as never], ptr.extend(key), opts), 'minify'));
  }

  // Find keys that are in the output but not in the input (Addition)
  for (const key of Object.keys(output)) {
    if (!(key in input)) ops.push(...transform(diff(undefined, output[key as never], ptr.extend(key), opts), 'minify'));
  }
  for (const key of Object.getOwnPropertySymbols(output)) {
    if (!(key in input)) ops.push(...transform(diff(undefined, output[key as never], ptr.extend(key), opts), 'minify'));
  }

  opts[inputSeen].pop();
  opts[outputSeen].pop();

  return ops;
}

/**
 * Count the number of fields impacted by an operation
 * - For operations on leaf values (primitives, etc.), cost is 1
 * - For operations that replace objects/arrays, count all leaf fields
 */
function getFieldsImpacted(input: unknown, op: Mini.Op): number {
  switch (op[0]) {
    case '+':
      return countFields(op[2]);
    case '-':
    case '^':
    case '>':
      return countFields(input);
    case '~':
      return countFields(input) + countFields(op[2]);
    case '?':
      return 0;
  }
}

/**
 * Recursively count the number of leaf fields in a value
 */
function countFields(value: unknown): number {
  if (typeof value !== 'object' || value === null) return 1;

  // Any objects have a base cost of 1 just for being objects
  // This sways the system to prefer primitives

  if (Array.isArray(value)) {
    if (value.length === 0) return 1;
    return value.reduce((sum, item) => sum + countFields(item), 1);
  }

  // Handle special objects (Date, RegExp, etc.) as single fields
  if (
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Error ||
    value instanceof String ||
    value instanceof Number ||
    value instanceof Boolean ||
    ArrayBuffer.isView(value) ||
    value instanceof ArrayBuffer
  ) {
    return 1;
  }

  // Handle Set and Map
  if (value instanceof Set) {
    if (value.size === 0) return 1;
    return Array.from(value).reduce((sum, item) => sum + countFields(item), 1);
  }

  if (value instanceof Map) {
    if (value.size === 0) return 1;
    return Array.from(value.values()).reduce((sum, item) => sum + countFields(item), 1);
  }

  // Regular objects: count all properties
  const keys = Object.keys(value);
  const symbols = Object.getOwnPropertySymbols(value);
  const allKeys = [...keys, ...symbols];

  if (allKeys.length === 0) return 1;
  return allKeys.reduce((sum, key) => sum + countFields((value as any)[key]), 1);
}

function getCost(input: any, x: Op, opts?: TransformOpts & OptimizeOpts) {
  // When optimizing for impact, count the number of fields impacted
  if (opts?.optimize === 'impact') return getFieldsImpacted(input, minifyOp(x));

  if (opts?.transform === 'serialize') return serializeOp(x).length;
  if (opts?.transform === 'minify') x = minifyOp(x);
  if (opts?.transform === 'maximize') x = maximizeOp(x);

  return JSON.stringify(x).length;
}

function getPatchCost(input: unknown, patch: MiniPatch, opts?: TransformOpts & OptimizeOpts) {
  // When optimizing for impact, sum the fields impacted by all operations
  if (opts?.optimize === 'impact') return patch.reduce((sum, op) => sum + getFieldsImpacted(input, op), 0);

  const transformedPatch = transform(patch, opts?.transform);

  if (opts?.transform === 'serialize') return (transformedPatch as SerialPatch).length;
  return (transformedPatch as Op[]).reduce((sum, op) => sum + getCost(input, op, opts), 0);
}

function checkFullReplace(
  input: unknown,
  output: unknown,
  ptr: Pointer,
  patch: MiniPatch,
  opts?: CloneOpts & TransformOpts & OptimizeOpts,
): MiniPatch {
  if (opts?.optimize === 'impact') return patch;

  try {
    // Check whether a full replacement would be smaller than the defined ops
    const fullReplace: MiniPatch = [['~', ptr, clone(output, opts)]];
    const fullReplaceCost = getPatchCost(input, fullReplace, opts);
    const opsCost = getPatchCost(input, patch, opts);

    if (fullReplaceCost < opsCost) return fullReplace;
  } catch (e) {
    if (!(e instanceof TypeError) || !e.message.startsWith('Converting circular structure to JSON')) throw e;
  }
  return patch;
}
