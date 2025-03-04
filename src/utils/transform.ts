import { MaxiPatch, MiniPatch, Patch, SerialPatch, maximize, minify, serialize } from '../patch';
import { Transformer } from './types';

/**
 * Convert a Patch into a {@link MiniPatch}
 *
 * @param patch - The patch to transform
 * @param transform - The transform to apply
 */
export function transform(patch: Patch, transform: 'minify'): MiniPatch;
/**
 * Convert a Patch into a {@link MaxiPatch}
 *
 * @param patch - The patch to transform
 * @param transform - The transform to apply
 */
export function transform(patch: Patch, transform: 'maximize'): MaxiPatch;
/**
 * Convert a Patch into a {@link SerialPatch}
 *
 * @param patch - The patch to transform
 * @param transform - The transform to apply
 */
export function transform(patch: Patch, transform: 'serialize'): SerialPatch;
/**
 * Convert a Patch into a uniform format, following the provided transform
 * If `transform` isn't set, the {@link Patch} is unaltered
 *
 * @param patch - The patch to transform
 * @param transform - The transform to apply
 */
export function transform(patch: Patch, transform?: Transformer): Patch;

export function transform(patch: Patch, transform?: Transformer): Patch {
  if (!transform) return patch;
  if (transform === 'minify') return minify(patch);
  if (transform === 'maximize') return maximize(patch);
  if (transform === 'serialize') return serialize(patch);
  return patch;
}
