import { describe, test } from 'vitest';
import { Pointer } from './pointer';

describe('toString', () => {
  /**
   * https://datatracker.ietf.org/doc/html/rfc6901#section-5
   */
  test.for([
    [[], ''],
    [['foo'], '/foo'],
    [['foo', '0'], '/foo/0'],
    [[''], '/'],
    [['a/b'], '/a~1b'],
    [['c%d'], '/c%d'],
    [['e^f'], '/e^f'],
    [['g|h'], '/g|h'],
    [['i\\j'], '/i\\j'],
    [['k"l'], '/k"l'],
    [[' '], '/ '],
    [['m~n'], '/m~0n'],
  ] as [string[], string][])('%j -> %j', ([tokens, expected], { expect }) => {
    expect(new Pointer(tokens).toString()).toEqual(expected);
  });
});

test('toBSON', ({ expect }) => {
  const p = new Pointer(['foo', '\u03A9', 0]);
  expect(p.toBSON()).toEqual('/foo/\u03A9/0');
});

describe('from', () => {
  /**
   * https://datatracker.ietf.org/doc/html/rfc6901#section-4
   */
  test.for([
    ['', []],
    ['/foo', ['foo']],
    ['/foo/0', ['foo', '0']],
    ['/', ['']],
    ['/a~1b', ['a/b']],
    ['/c%d', ['c%d']],
    ['/e^f', ['e^f']],
    ['/g|h', ['g|h']],
    ['/i\\j', ['i\\j']],
    ['/k"l', ['k"l']],
    ['/ ', [' ']],
    ['/m~0n', ['m~n']],
  ] as [string, string[]][])('%j -> %j', ([string, expected], { expect }) => {
    expect(Pointer.from(string).tokens).toEqual(expected);
  });

  test('Pointer -> Pointer', ({ expect }) => {
    const p = new Pointer(['foo', 'bar']);
    expect(Pointer.from(p)).toEqual(p);
  });

  test('Binary -> Pointer', ({ expect }) => {
    const p = new Pointer(['foo', 'bar']);
    expect(Pointer.from(p)).toEqual(p);
  });
});

test('extend', ({ expect }) => {
  expect(new Pointer([]).extend('foo')).toEqual(new Pointer(['foo']));
  expect(new Pointer(['foo']).extend('bar')).toEqual(new Pointer(['foo', 'bar']));
});

test('BSON encoding', ({ expect }) => {
  const p = new Pointer(['foo', '0']);
  expect(Pointer.from(p.toBSON())).toEqual(p);
});

describe('move', () => {
  test.for([
    [
      'renaming a key in place preserves its original position',
      { a: 1, b: 2, c: 3 },
      '/b',
      '/x',
      2,
      { a: 1, x: 2, c: 3 },
      (r: any) => Object.keys(r),
      ['a', 'x', 'c'],
    ],
    [
      'moving a key onto itself is a no-op, position included',
      { a: 1, b: 2, c: 3 },
      '/b',
      '/b',
      2,
      { a: 1, b: 2, c: 3 },
      (r: any) => Object.keys(r),
      ['a', 'b', 'c'],
    ],
    [
      'moving a key onto a different existing key overwrites it in place',
      { a: 1, b: 2, c: 3 },
      '/a',
      '/c',
      1,
      { b: 2, c: 1 },
      (r: any) => Object.keys(r),
      ['b', 'c'],
    ],
    [
      'moving between different objects appends at the destination',
      { foo: { bar: 'baz', waldo: 'fred' }, qux: { corge: 'grault' } },
      '/foo/waldo',
      '/qux/thud',
      'fred',
      { foo: { bar: 'baz' }, qux: { corge: 'grault', thud: 'fred' } },
      (r: any) => Object.keys(r.qux),
      ['corge', 'thud'],
    ],
    [
      'moving an array element preserves array semantics',
      { foo: ['all', 'grass', 'cows', 'eat'] },
      '/foo/1',
      '/foo/3',
      'grass',
      { foo: ['all', 'cows', 'eat', 'grass'] },
      null,
      null,
    ],
    [
      'renaming a Map key preserves its original position',
      new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]),
      '/b',
      '/x',
      2,
      new Map([
        ['a', 1],
        ['x', 2],
        ['c', 3],
      ]),
      (r: any) => [...r.keys()],
      ['a', 'x', 'c'],
    ],
  ] as [string, unknown, string, string, unknown, unknown, ((r: any) => unknown[]) | null, unknown[] | null][])('%s', ([
    ,
    target,
    from,
    to,
    newVal,
    expected,
    getKeys,
    expectedKeys,
  ], { expect }) => {
    const result = Pointer.from(to).move(target, Pointer.from(from), newVal);
    expect(result).toEqual(expected);
    if (getKeys) expect(getKeys(result)).toEqual(expectedKeys);
  });
});

describe('asymmetricMatch', () => {
  test.for([
    [Pointer.from(''), Pointer.from('')],
    [Pointer.from(''), ''],
    [Pointer.from(''), new Uint8Array()],
    [Pointer.from('/a'), Pointer.from('/a')],
    [Pointer.from('/a'), '/a'],
    [Pointer.from('/a'), new Uint8Array([47, 97])],
    [Pointer.from('/a/b'), Pointer.from('/a/b')],
    [Pointer.from('/a/b'), '/a/b'],
    [Pointer.from('/a/b'), new Uint8Array([47, 97, 47, 98])],
  ])('%o === %o', ([a, b], { expect }) => {
    expect(a).toEqual(b);
  });
  test.for([
    [Pointer.from(''), Pointer.from('/')],
    [Pointer.from(''), '/'],
    [Pointer.from(''), new Uint8Array([47])],
    [Pointer.from('/a'), Pointer.from('/b')],
    [Pointer.from('/a'), '/b'],
    [Pointer.from('/a'), new Uint8Array([47, 98])],
    [Pointer.from('/a/b'), Pointer.from('/a/b/c')],
    [Pointer.from('/a/b'), '/a/b/c'],
    [Pointer.from('/a/b'), new Uint8Array([47, 97, 47, 98, 47, 99])],
  ])('%o !== %o', ([a, b], { expect }) => {
    expect(a).not.toEqual(b);
  });
});
