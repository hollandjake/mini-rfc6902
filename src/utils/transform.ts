import { Maxi, maximize, Mini, minify, Patch } from '../patch';
import { Transformer } from './types';

export function transform(patch: Patch, transform: 'minify'): Mini.Patch;
export function transform(patch: Patch, transform: 'maximize'): Maxi.Patch;
export function transform<T extends Patch>(patch: T, transform?: Transformer): T;
export function transform(patch: Patch, transform?: Transformer): Patch {
  if (!transform) return patch;
  if (transform === 'minify') return minify(patch);
  if (transform === 'maximize') return maximize(patch);
  return patch;
}
