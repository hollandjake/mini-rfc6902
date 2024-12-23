export { apply } from './apply.js';
export { create } from './create.js';
export type { Patch } from './patch.js';
export { Pointer, RootPointer } from './pointer.js';
import { Maxi, Mini } from './patch.js';

export * from './utils/index.js';

export type MaxiPatch = Maxi.Patch;
export type MiniPatch = Mini.Patch;
