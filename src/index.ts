export { apply } from './apply';
export { create } from './create';
export type { Patch } from './patch';
export { Pointer, RootPointer } from './pointer';
import { Maxi, Mini } from './patch';

export { eq, transform } from './utils';

export type MaxiPatch = Maxi.Patch;
export type MiniPatch = Mini.Patch;
