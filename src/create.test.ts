import { describe, test } from 'vitest';
import { apply } from './apply';
import { create } from './create';

const undefinedA = undefined;
const undefinedB = undefined;
const nullA = null;
const nullB = null;
const booleanA = true;
const booleanB = false;
const numberA = 1;
const numberB = 2;
const stringA = 'hello';
const stringB = 'world';
const funcA = function a() {};
const funcAClone = function a() {};
const funcB = function b() {};
const objA = { some_key: 'some_val' };
const objB = { some_other_key: 'some_other_val' };

const nonStringKeyedObjectA = {
  0: 'a',
  [true as never]: 'a',
};
const nonStringKeyedObjectB = {
  0: 'b',
  [true as never]: 'b',
};

const symbolA = Symbol('a');
const symbolAClone = Symbol('a');
const symbolB = Symbol('b');

const arrayA = [undefinedA, nullA, booleanA, numberA, stringA, funcA, objA];
const arrayB = [undefinedB, nullB, booleanB, numberB, stringB, funcB, objB];

const objARecursive: { some_key: any } = { some_key: null };
objARecursive.some_key = objARecursive;

const objBRecursive: { some_other_key: any } = { some_other_key: null };
objBRecursive.some_other_key = objBRecursive;

const metaA = {
  string: stringA,
  number: numberA,
  boolean: booleanA,
  object: objA,
  function: funcA,
  null: nullA,
  undefined: undefinedA,
  array: arrayA,
};
const metaB = {
  string: stringB,
  number: numberB,
  boolean: booleanB,
  object: objB,
  function: funcB,
  null: nullB,
  undefined: undefinedB,
  array: arrayB,
};

describe('create', () => {
  const suite = [
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
    [[], [1, 2, 3]],
    [
      [1, 2],
      [1, 2, 3, 4],
    ],
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
    [new Uint8Array([1, 2, 3]), new Uint8Array([3, 2, 1])],
    [new Uint16Array([1, 2, 3]), new Uint16Array([3, 2, 1])],
    [new Uint32Array([1, 2, 3]), new Uint32Array([3, 2, 1])],
    [new Float32Array([1, 2, 3]), new Float32Array([3, 2, 1])],
    [new Float64Array([1, 2, 3]), new Float64Array([3, 2, 1])],
    [new Int32Array([1, 2, 3]).buffer, new Int32Array([3, 2, 1]).buffer],
    [new DataView(new Int32Array([1, 2, 3]).buffer), new DataView(new Int32Array([3, 2, 1]).buffer)],
    // We are unable to determine where in a set we want to delete from (as its unordered) so we need to do a full replacement
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
    [nonStringKeyedObjectA, nonStringKeyedObjectB],
    [metaA, metaB],
  ];

  describe('default', () => {
    test.for(suite)('(%s, %s)', ([a, b], { expect }) => {
      const patch = create(a, b);
      expect(patch).not.toEqual(null);
      expect(apply(a, patch)).toEqual(b);
    });
  });

  describe('maxi', () => {
    test.for(suite)('(%s, %s)', ([a, b], { expect }) => {
      const patch = create(a, b, { transform: 'maximize' });
      expect(patch).not.toEqual(null);
      expect(apply(a, patch)).toEqual(b);
    });
  });

  describe('mini', () => {
    test.for(suite)('(%s, %s)', ([a, b], { expect }) => {
      const patch = create(a, b, { transform: 'minify' });
      expect(patch).not.toEqual(null);
      expect(apply(a, patch)).toEqual(b);
    });
  });

  describe('custom', () => {
    test.for(suite)('(%s, %s)', ([a, b], { expect }) => {
      const patch = create(a, b, {
        diff: (_, o, p) => {
          // example force all to be removed and added (effectively a replacement)
          return [
            ['-', p],
            ['+', p, o],
          ];
        },
      });
      expect(patch).not.toEqual(null);
      expect(apply(a, patch)).toEqual(b);
    });

    test('object with own diff function', ({ expect }) => {
      class SomeDiffClass implements Diffable {
        constructor(readonly someField: string) {}

        diff(output: object, ptr: Pointer, opts: WithSkip<DiffOpts>): Patch {
          if (!(output instanceof SomeDiffClass)) opts.skip();
          // Compare instances based on "someField"
          if (output.someField === this.someField) return [];
          // As an example, just replace the field
          return [['~', ptr.extend('someField'), output.someField]];
        }
      }

      const a = new SomeDiffClass('a');
      const b = new SomeDiffClass('b');
      const patch = create(a, b);
      expect(patch).not.toEqual(null);
      expect(apply(a, patch)).toEqual(b);
    });
  });
});
