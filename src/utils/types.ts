import { Patch } from '../patch';
import { Pointer } from '../pointer';

export type CloneOpts = { clone?: Cloner };
export type EqOpts = { eq?: EqFunc };
export type DiffOpts = EqOpts & CloneOpts & { diff?: Differ };
type TransformOpts = { transform?: 'minify' | 'maximize' };
export type CreateOpts = DiffOpts & TransformOpts;

export type ApplyOpts = EqOpts & CloneOpts & TransformOpts;

export type SkipFunc = () => void;
export const SKIP = Symbol('skip');

export function skip() {
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
 * @param x - left hand side of the equality comparison
 * @param y - right hand side of the equality comparison
 * @param opts - options for custom handling
 *
 * Call `opts.skip()` to allow default handling
 */
export type EqFunc<O extends object = {}> = (
  x: Exclude<any, null | undefined>,
  y: Exclude<any, null | undefined>,
  opts: WithSkip<EqOpts> & O,
) => boolean;

export type WithSkip<T> = T & { skip: SkipFunc };
