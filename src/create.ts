import { diff } from './diff';
import { MaxiPatch, MiniPatch, Patch, SerialPatch, maximize, minify, serialize } from './patch';
import { RootPointer } from './pointer';
import { CreateOpts } from './utils';

/**
 * Returns a list of operations (a JSON Patch) comprised of the operations to transform `input` into `output`.
 * It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
 * as a full replacement may result in more bytes being sent.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * The output will be a {@link MiniPatch}
 *
 * If the user provided {@link Differ} returns a {@link SerialPatch},
 * it will be converted to a {@link MiniPatch} and then combined with the other patches
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 * @param opts - options for custom handling
 * @param opts.transform - force the output to all be minified
 */
export function create(input: any, output: any, opts: CreateOpts & { transform: 'minify' }): MiniPatch | null;
/**
 * Returns a list of operations (a JSON Patch) comprised of the operations to transform `input` into `output`.
 * It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
 * as a full replacement may result in more bytes being sent.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * The output will be a {@link MaxiPatch}
 *
 * If the user provided {@link Differ} returns a {@link SerialPatch},
 * it will be converted to a {@link MiniPatch} and then combined with the other patches
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 * @param opts - options for custom handling
 * @param opts.transform - force the output to all be maximised
 */
export function create(input: any, output: any, opts: CreateOpts & { transform: 'maximize' }): MaxiPatch | null;
/**
 * Returns a list of operations (a JSON Patch) comprised of the operations to transform `input` into `output`.
 * It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
 * as a full replacement may result in more bytes being sent.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * The output will be a {@link SerialPatch}
 *
 * If the user provided {@link Differ} returns a {@link SerialPatch},
 * it will be converted to a {@link MiniPatch} and then combined with the other patches
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 * @param opts - options for custom handling
 * @param opts.transform - force the output to be serialized
 */
export function create(input: any, output: any, opts: CreateOpts & { transform: 'serialize' }): SerialPatch | null;
/**
 * Returns a list of operations (a JSON Patch) comprised of the operations to transform `input` into `output`.
 * It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
 * as a full replacement may result in more bytes being sent.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * The output will be a {@link Patch}
 *
 * If the user provided {@link Differ} returns a {@link SerialPatch},
 * it will be converted to a {@link MiniPatch} and then combined with the other patches
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 * @param opts - Optional options for custom handling
 */
export function create(input: any, output: any, opts: CreateOpts): Patch | null;
/**
 * Returns a list of operations (a JSON Patch) comprised of the operations to transform `input` into `output`.
 * It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
 * as a full replacement may result in more bytes being sent.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * The output will be a {@link MiniPatch}
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 */
export function create(input: any, output: any): MiniPatch | null;

export function create(input: any, output: any, opts: CreateOpts = {}): Patch | null {
  const patch = diff(input, output, RootPointer, opts);
  if (patch.length === 0) return null;

  if (opts?.transform === 'minify') return minify(patch);
  if (opts?.transform === 'maximize') return maximize(patch);
  if (opts?.transform === 'serialize') return serialize(patch);
  return patch;
}
