import { describe, test } from 'vitest';
import { diff } from './diff';
import { minifyOp } from './patch';
import { RootPointer } from './pointer';
import { EQUALITY_TESTS } from './utils/eq.test';

const funcA = function a() {};
const funcAClone = function a() {};
const funcB = function b() {};
const objA = { some_key: 'some_val' };
const objB = { some_other_key: 'some_other_val' };
const symbolA = Symbol('a');
const symbolAClone = Symbol('a');
const symbolB = Symbol('b');

const objARecursive: { some_key: any } = { some_key: null };
objARecursive.some_key = objARecursive;

const objBRecursive: { some_other_key: any } = { some_other_key: null };
objBRecursive.some_other_key = objBRecursive;

describe('equality', () => {
  test.for(EQUALITY_TESTS)('(%s, %s)', ([a, b], { expect }) => {
    expect(diff(a, b, RootPointer, {})).toEqual([]);
  });
});

describe('difference', () => {
  test.for([
    [undefined, null, [['+', '', null]]],
    [null, undefined, [['-', '']]],
    [true, false, [['~', '', false]]],
    [1, 2, [['~', '', 2]]],
    [1, -1, [['~', '', -1]]],
    [Infinity, -Infinity, [['~', '', -Infinity]]],
    [-0, +0, [['~', '', +0]]],
    ['', 'a', [['~', '', 'a']]],
    ['a', 'b', [['~', '', 'b']]],
    [funcA, funcAClone, [['~', '', funcAClone]]],
    [funcA, funcB, [['~', '', funcB]]],
    [{ a: 'a' }, { a: 'b' }, [['~', '/a', 'b']]],
    [{ a: 'a' }, { a: { b: 'c' } }, [['~', '/a', { b: 'c' }]]],
    [{ a: { b: 'c' } }, { a: { b: 'd' } }, [['~', '/a/b', 'd']]],
    [
      { a: 'a', b: 'b' },
      { a: 'b', b: 'a' },
      [
        ['~', '/a', 'b'],
        ['~', '/b', 'a'],
      ],
    ],
    [{}, { a: 'b' }, [['+', '/a', 'b']]],
    [symbolA, symbolAClone, [['~', '', symbolAClone]]],
    [symbolA, symbolB, [['~', '', symbolB]]],
    [[1], [1, 2], [['+', '/1', 2]]],
    [[objA, 2, 3], [objB, 2, 3], [['~', '/0', objB]]],
    [[1, 2, 3], [2, 1, 3], [['~', '', [2, 1, 3]]]],
    [[objA], [objA, objA], [['^', '/0', '/1']]],
    [new Date(0), new Date(1), [['~', '', new Date(1)]]],
    [new Error('some error'), new Error('some other error'), [['~', '', new Error('some other error')]]],
    [new String('test'), new String('t'), [['~', '', new String('t')]]],
    [new Number(1), new Number(2), [['~', '', new Number(2)]]],
    [new Boolean(true), new Boolean(false), [['~', '', new Boolean(false)]]],
    [new RegExp('a', 'g'), new RegExp('b', 'g'), [['~', '', new RegExp('b', 'g')]]],
    [new RegExp('a', 'g'), new RegExp('a', 'y'), [['~', '', new RegExp('a', 'y')]]],
    [new Uint8Array([1, 2, 3]), new Uint8Array([3, 2, 1]), [['~', '', new Uint8Array([3, 2, 1])]]],
    [new Uint16Array([1, 2, 3]), new Uint16Array([3, 2, 1]), [['~', '', new Uint16Array([3, 2, 1])]]],
    [new Uint32Array([1, 2, 3]), new Uint32Array([3, 2, 1]), [['~', '', new Uint32Array([3, 2, 1])]]],
    [new Float32Array([1, 2, 3]), new Float32Array([3, 2, 1]), [['~', '', new Float32Array([3, 2, 1])]]],
    [new Float64Array([1, 2, 3]), new Float64Array([3, 2, 1]), [['~', '', new Float64Array([3, 2, 1])]]],
    [new Int32Array([1, 2, 3]).buffer, new Int32Array([3, 2, 1]).buffer, [['~', '', new Int32Array([3, 2, 1]).buffer]]],
    [
      new DataView(new Int32Array([1, 2, 3]).buffer),
      new DataView(new Int32Array([3, 2, 1]).buffer),
      [['~', '', new DataView(new Int32Array([3, 2, 1]).buffer)]],
    ],
    // We are unable to determine where in a set we want to delete from (as its unordered) so we need to do a full replacement
    [new Set([1, 2, 3]), new Set([1, 2]), [['~', '', new Set([1, 2])]]],
    [
      new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]),
      new Map([
        ['a', 1],
        ['b', 2],
      ]),
      [['-', '/c']],
    ],
    [
      { rec: objARecursive },
      { rec: objBRecursive },
      [
        ['-', '/rec/some_key'],
        ['+', '/rec/some_other_key', objBRecursive],
      ],
    ],
  ])('(%s, %s)', ([a, b, expected], { expect }) => {
    expect(diff(a, b, RootPointer, {})).toEqual(expected);
  });

  test.for([
    [new Int8Array([1, 2, 3]), new Int8Array([3, 2, 1])],
    [new Int16Array([1, 2, 3]), new Int16Array([3, 2, 1])],
    [new Int32Array([1, 2, 3]), new Int32Array([3, 2, 1])],
  ])('(%s, %s)', ([a, b], { expect }) => {
    const patch = diff(a, b, RootPointer, {});
    expect(patch).toHaveLength(1);
    const op = minifyOp(patch[0]);
    expect(op[0]).toEqual('~');
    expect(op[1]).toEqual('');
    expect(op[2]).toBeInstanceOf(b.constructor);
    expect(!b.some((v, i) => v !== (op[2] as Buffer)[i])).toBeTruthy();
  });
});
