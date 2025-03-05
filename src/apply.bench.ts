import { bench, describe } from 'vitest';
import { apply } from './apply';
import { Patch } from './patch';
import { Pointer } from './pointer';

describe.for([1, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6])('%i op patch', i => {
  for (const [name, patch] of [
    ['Maxi + Pointer', [{ op: 'add', path: Pointer.from('/baz'), value: 'qux' }]],
    ['Maxi + String', [{ op: 'add', path: '/baz', value: 'qux' }]],
    ['Mini + Pointer', [['+', Pointer.from('/baz'), 'qux']]],
    ['Mini + String', [['+', '/baz', 'qux']]],
    ['Serial', Buffer.from('JQAAAAIwAAIAAAArAAIxAAUAAAAvYmF6AAIyAAQAAABxdXgAAA==', 'base64')],
  ] as [string, Patch][]) {
    let builtPatch: any = Array(i).fill(patch);
    if (patch instanceof Uint8Array) builtPatch = Buffer.concat(builtPatch);
    else builtPatch = builtPatch.flat();

    const a = { foo: 'bar' };

    bench(name, () => {
      apply(a, builtPatch);
    });
  }
});
