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
});

test('extend', ({ expect }) => {
  expect(new Pointer([]).extend('foo')).toEqual(new Pointer(['foo']));
  expect(new Pointer(['foo']).extend('bar')).toEqual(new Pointer(['foo', 'bar']));
});
