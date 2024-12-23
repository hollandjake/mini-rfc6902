import { describe, test } from 'vitest';
import { Pointer } from './pointer.js';

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
