import { describe, test } from 'vitest';
import { eq } from './eq';

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

export const EQUALITY_TESTS = [
  [undefined, undefined],
  [null, null],
  [true, true],
  [NaN, NaN],
  [1, 1],
  ['', ''],
  ['a', 'a'],
  [funcA, funcA],
  [{}, {}],
  [symbolA, symbolA],
  [[], []],
  [
    [1, 2],
    [1, 2],
  ],
  [new Error(), new Error()],
  [new String('test'), new String('test')],
  [new Number(1), new Number(1)],
  [new Boolean(true), new Boolean(true)],
  [new Date(10), new Date(10)],
  [new RegExp('a', 'g'), new RegExp('a', 'g')],
  [new Int8Array([1, 2, 3]), new Int8Array([1, 2, 3])],
  [new Int16Array([1, 2, 3]), new Int16Array([1, 2, 3])],
  [new Int32Array([1, 2, 3]), new Int32Array([1, 2, 3])],
  [new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3])],
  [new Uint16Array([1, 2, 3]), new Uint16Array([1, 2, 3])],
  [new Uint32Array([1, 2, 3]), new Uint32Array([1, 2, 3])],
  [new Float32Array([1, 2, 3]), new Float32Array([1, 2, 3])],
  [new Float64Array([1, 2, 3]), new Float64Array([1, 2, 3])],
  [new Int32Array([1, 2, 3]).buffer, new Int32Array([1, 2, 3]).buffer],
  [new DataView(new Int32Array([1, 2, 3]).buffer), new DataView(new Int32Array([1, 2, 3]).buffer)],
  [new Set([1, 2, 3]), new Set([3, 2, 1])],
  [
    new Map([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]),
    new Map([
      ['c', 3],
      ['b', 2],
      ['a', 1],
    ]),
  ],
  [{ objARecursive }, { objARecursive }],
] as const;

describe('eq', () => {
  test.for(EQUALITY_TESTS)('(%s, %s)', ([a, b], { expect }) => {
    expect(eq(a, b, {})).toBe(true);
  });
});

describe('not eq', () => {
  test.for([
    [undefined, null],
    [null, undefined],
    [true, false],
    [1, 2],
    [1, -1],
    [Infinity, -Infinity],
    [-0, +0],
    ['', 'a'],
    ['a', 'b'],
    [funcA, funcAClone],
    [funcA, funcB],
    [{ a: 'a' }, { a: 'b' }],
    [{ a: 'a' }, { a: { b: 'c' } }],
    [{ a: { b: 'c' } }, { a: { b: 'd' } }],
    [
      { a: 'a', b: 'b' },
      { a: 'b', b: 'a' },
    ],
    [{}, { a: 'b' }],
    [symbolA, symbolAClone],
    [symbolA, symbolB],
    [[1], [1, 2]],
    [
      [objA, 2, 3],
      [objB, 2, 3],
    ],
    [
      [1, 2, 3],
      [2, 1, 3],
    ],
    [[objA], [objA, objA]],
    [new Date(0), new Date(1)],
    [new Error('some error'), new Error('some other error')],
    [new String('test'), new String('t')],
    [new Number(1), new Number(2)],
    [new Boolean(true), new Boolean(false)],
    [new RegExp('a', 'g'), new RegExp('b', 'g')],
    [new RegExp('a', 'g'), new RegExp('a', 'y')],
    [new Int8Array([1, 2, 3]), new Int8Array([3, 2, 1])],
    [new Int16Array([1, 2, 3]), new Int16Array([3, 2, 1])],
    [new Int32Array([1, 2, 3]), new Int32Array([3, 2, 1])],
    [new Uint8Array([1, 2, 3]), new Uint8Array([3, 2, 1])],
    [new Uint16Array([1, 2, 3]), new Uint16Array([3, 2, 1])],
    [new Uint32Array([1, 2, 3]), new Uint32Array([3, 2, 1])],
    [new Float32Array([1, 2, 3]), new Float32Array([3, 2, 1])],
    [new Float64Array([1, 2, 3]), new Float64Array([3, 2, 1])],
    [new Int32Array([1, 2, 3]).buffer, new Int32Array([3, 2, 1]).buffer],
    [new DataView(new Int32Array([1, 2, 3]).buffer), new DataView(new Int32Array([3, 2, 1]).buffer)],
    [new Set([1, 2, 3]), new Set([1, 2])],
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
    ],
    [{ rec: objARecursive }, { rec: objBRecursive }],
  ])('(%s, %s)', ([a, b], { expect }) => {
    expect(eq(a, b, {})).toBe(false);
  });
});

describe('eqFunction', () => {
  test('eq', ({ expect }) => {
    class A {
      constructor(readonly a: string) {}

      eq(other: any) {
        return other instanceof A && other.a.toLowerCase() === this.a.toLowerCase();
      }
    }

    expect(eq(new A('TEST'), new A('test'), {})).toBe(true);
  });

  test('isEqual', ({ expect }) => {
    class A {
      constructor(readonly a: string) {}

      isEqual(other: any) {
        return other instanceof A && other.a.toLowerCase() === this.a.toLowerCase();
      }
    }

    expect(eq(new A('TEST'), new A('test'), {})).toBe(true);
  });

  test('equal', ({ expect }) => {
    class A {
      constructor(readonly a: string) {}

      equal(other: any) {
        return other instanceof A && other.a.toLowerCase() === this.a.toLowerCase();
      }
    }

    expect(eq(new A('TEST'), new A('test'), {})).toBe(true);
  });

  test('equals', ({ expect }) => {
    class A {
      constructor(readonly a: string) {}

      equals(other: any) {
        return other instanceof A && other.a.toLowerCase() === this.a.toLowerCase();
      }
    }

    expect(eq(new A('TEST'), new A('test'), {})).toBe(true);
  });

  test('asymmetricMatch', ({ expect }) => {
    class A {
      constructor(readonly a: string) {}

      asymmetricMatch(other: any) {
        return typeof other === 'string' && this.a.toLowerCase() === other.toLowerCase();
      }
    }

    expect(eq('TEST', new A('test'), {})).toBe(true);
  });
});
