import { Patch } from '../patch';
import { Pointer } from '../pointer';

export type CloneOpts = { clone?: Cloner };
export type EqOpts = { eq?: EqFunc };
export type Transformer = 'minify' | 'maximize' | 'serialize';
type TransformOpts = { transform?: Transformer };
export type CreateOpts = EqOpts & CloneOpts & TransformOpts & { diff?: Differ };
export type DiffOpts = CreateOpts;

export type ApplyOpts = EqOpts & CloneOpts & TransformOpts;

export type SkipFunc = () => never;
export const SKIP = Symbol('skip');

export function skip(): never {
  throw SKIP;
}

/**
 * Optional user defined deep clone function
 *
 * @param val - The value to clone
 * @param opts - options for custom handling
 *
 * Call `opts.skip()` to allow default handling
 */
export type Cloner<T = any, O extends object = {}> = (val: T, opts: WithSkip<CloneOpts> & O) => T;
/**
 * Optional user defined diff creation function
 *
 * @param input - the source to base the difference from
 * @param output - the target to base the diff on
 * @param ptr - Pointer representing the current position relative to the input root
 * @param opts - options for custom handling
 *
 * Call `opts.skip()` to allow default handling
 */
export type Differ<O extends object = {}> = (
  input: Exclude<any, null | undefined>,
  output: Exclude<any, null | undefined>,
  ptr: Pointer,
  opts: WithSkip<DiffOpts> & O,
) => Patch;

/**
 * Optional user defined deep equality function
 *
 * @param a - left hand side of the equality comparison
 * @param b - right hand side of the equality comparison
 * @param opts - options for custom handling
 *
 * Call `opts.skip()` to allow default handling
 */
export type EqFunc<O extends object = {}> = (
  a: Exclude<any, null | undefined>,
  b: Exclude<any, null | undefined>,
  opts: WithSkip<EqOpts> & O,
) => boolean;

export type WithSkip<T> = T & { skip: SkipFunc };

/**
 * Implementing this allows the system to use your own patches rather than a full replacement of the object
 */
export interface Diffable {
  diff(output: object, ptr: Pointer, opts: WithSkip<DiffOpts>): Patch;
}
