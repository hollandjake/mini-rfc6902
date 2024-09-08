import { diff } from './diff';
import { Maxi, maximize, Mini, minify, Patch } from './patch';
import { RootPointer } from './pointer';
import { CreateOpts } from './utils';

/**
 * Returns a list of operations (a JSON Patch) comprised of the operations to transform `a` into `b`.
 * It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
 * as a full replacement may result in more bytes being sent.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * Equality checks are performed using nodes util `isDeepStrictEqual` for maximum performance
 *
 * The output will be a {@link Patch full size patch}
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 */
export function create(input: any, output: any): Patch | null;
/**
 * Returns a list of operations (a JSON Patch) comprised of the operations to transform `a` into `b`.
 * It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
 * as a full replacement may result in more bytes being sent.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * Equality checks are performed using nodes util `isDeepStrictEqual` for maximum performance
 *
 * The output will be a {@link Mini.Patch minified patch}
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 * @param opts - options for custom handling
 * @param opts.transform - force the output to all be minified
 */
export function create(input: any, output: any, opts: CreateOpts & { transform: 'minify' }): Mini.Patch | null;
/**
 * Returns a list of operations (a JSON Patch) comprised of the operations to transform `a` into `b`.
 * It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
 * as a full replacement may result in more bytes being sent.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * Equality checks are performed using nodes util `isDeepStrictEqual` for maximum performance
 *
 * The output will be a {@link Mini.Patch minified patch}
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 * @param opts - options for custom handling
 * @param opts.transform - force the output to all be maximised
 */
export function create(input: any, output: any, opts: CreateOpts & { transform: 'maximize' }): Maxi.Patch | null;
/**
 * Returns a list of operations (a JSON Patch) comprised of the operations to transform `a` into `b`.
 * It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
 * as a full replacement may result in more bytes being sent.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * Equality checks are performed using nodes util `isDeepStrictEqual` for maximum performance
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 * @param opts - Optional options for custom handling
 */
export function create(input: any, output: any, opts: CreateOpts): Patch | null;
/**
 * Returns a list of operations (a JSON Patch) comprised of the operations to transform `a` into `b`.
 * It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
 * as a full replacement may result in more bytes being sent.
 *
 * For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
 * with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.
 *
 * Equality checks are performed using nodes util `isDeepStrictEqual` for maximum performance
 *
 * @param input - The input to compare from
 * @param output - The output to compare to
 * @param opts - Optional options for custom handling
 */
export function create(input: any, output: any, opts: CreateOpts = {}): Patch | null {
  const patch = diff(input, output, RootPointer, opts);
  if (patch.length === 0) return null;

  if (opts?.transform === 'minify') return minify(patch);
  if (opts?.transform === 'maximize') return maximize(patch);
  return patch;
}
