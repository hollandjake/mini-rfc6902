import { Patch } from '../patch';
import { Pointer } from '../pointer';

export type CloneOpts = { clone?: Cloner };
export type EqOpts = { eq?: EqFunc };
export type DiffOpts = EqOpts & CloneOpts & { diff?: Differ };
export type CreateOpts = DiffOpts & { transform?: 'minify' | 'maximize' };

export type Opts = CloneOpts & DiffOpts & EqOpts;

export type SkipFunc = () => void;
export const SKIP = Symbol('skip');

export function skip() {
  throw SKIP;
}

export type Cloner<T = any, O extends object = {}> = (v: T, opts: WithSkip<CloneOpts> & O) => T;
export type Differ<O extends object = {}> = (
  input: Exclude<any, null | undefined>,
  output: Exclude<any, null | undefined>,
  ptr: Pointer,
  opts: WithSkip<DiffOpts> & O
) => Patch;

export type EqFunc<O extends object = {}> = (
  x: Exclude<any, null | undefined>,
  y: Exclude<any, null | undefined>,
  opts: WithSkip<EqOpts> & O
) => boolean;

export interface OptsWithSkip extends Opts {
  skip: SkipFunc;
}

export type WithSkip<T> = T & { skip: SkipFunc };
