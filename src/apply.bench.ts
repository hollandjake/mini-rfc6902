import { bench } from 'vitest';
import { apply } from './apply';
import { Patch } from './patch';
import { Pointer } from './pointer';

for (const [name, patch] of [
  ['Maxi + Pointer', [{ op: 'add', path: Pointer.from('/baz'), value: 'qux' }]],
  ['Maxi + String', [{ op: 'add', path: '/baz', value: 'qux' }]],
  ['Mini + Pointer', [['+', Pointer.from('/baz'), 'qux']]],
  ['Mini + String', [['+', '/baz', 'qux']]],
  ['Serial', Buffer.from('JQAAAAIwAAIAAAArAAIxAAUAAAAvYmF6AAIyAAQAAABxdXgAAA==', 'base64')],
] as [string, Patch][]) {
  let builtPatch: any = Array(1000).fill(patch);
  if (patch instanceof Uint8Array) builtPatch = Buffer.concat(builtPatch);
  else builtPatch = builtPatch.flat();

  const a = { foo: 'bar' };

  bench(`apply - ${name}`, () => {
    apply(a, builtPatch);
  });
}
