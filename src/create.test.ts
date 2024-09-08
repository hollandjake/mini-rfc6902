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
const funcB = function b() {};
const objA = { some_key: 'some_val' };
const objB = { some_other_key: 'some_other_val' };

const arrayA = [undefinedA, nullA, booleanA, numberA, stringA, funcA, objA];
const arrayB = [undefinedB, nullB, booleanB, numberB, stringB, funcB, objB];

describe('create', () => {
  describe('Reversible', () => {
    const a = {
      string: stringA,
      number: numberA,
      boolean: booleanA,
      object: objA,
      function: funcA,
      null: nullA,
      undefined: undefinedA,
      array: arrayA,
    };
    const b = {
      string: stringB,
      number: numberB,
      boolean: booleanB,
      object: objB,
      function: funcB,
      null: nullB,
      undefined: undefinedB,
      array: arrayB,
    };

    test('default', ({ expect }) => {
      const patch = create(a, b);
      expect(patch).not.toEqual(null);
      expect(apply(a, patch!)).toEqual(b);
    });

    test('maxi', ({ expect }) => {
      const patch = create(a, b, { transform: 'maximize' });
      expect(patch).not.toEqual(null);
      expect(apply(a, patch!)).toEqual(b);
    });

    test('mini', ({ expect }) => {
      const patch = create(a, b, { transform: 'minify' });
      expect(patch).not.toEqual(null);
      expect(apply(a, patch!)).toEqual(b);
    });

    test('custom', ({ expect }) => {
      const patch = create(a, b, {
        diff: (_, o, p) => {
          // example force all to be removed and added
          return [
            ['-', p],
            ['+', p, o],
          ];
        },
      });
      expect(patch).not.toEqual(null);
      expect(apply(a, patch!)).toEqual(b);
    });
  });

  test('with non-string keys', ({ expect }) => {
    const a = {
      0: 'a',
      [true as never]: 'a',
    };
    const b = {
      0: 'b',
      [true as never]: 'b',
    };
    const patch = create(a, b);
    expect(patch).not.toEqual(null);
    expect(apply(a, patch!)).toEqual(b);
  });
});
