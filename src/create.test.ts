import { describe, test } from 'vitest';
import { apply } from './apply';
import { create, diff } from './create';
import { RootPointer } from './pointer';
import { serialize } from './utils';

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
const symbolA = Symbol('a');
const symbolB = Symbol('b');

const arrayA = [undefinedA, nullA, booleanA, numberA, stringA, funcA, objA, symbolA];
const arrayB = [undefinedB, nullB, booleanB, numberB, stringB, funcB, objB, symbolB];

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
      symbol: symbolA,
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
      symbol: symbolB,
      array: arrayB,
    };

    test('maxi', ({ expect }) => {
      const patch = create(a, b);
      expect(patch).not.toEqual(null);
      expect(apply(patch!, a)).toEqual(b);
    });

    test('mini', ({ expect }) => {
      const patch = create(a, b, true);
      expect(patch).not.toEqual(null);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
});

describe('diff', () => {
  describe('undefined -> undefined', () => {
    test.for([[undefined, undefined, []]])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('null -> null', () => {
    test.for([[null, null, []]])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('boolean -> boolean', () => {
    test.for([
      [true, true, []],
      [true, false, [['~', RootPointer, false]]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('number -> number', () => {
    test.for([
      [NaN, NaN, []],
      [1, 1, []],
      [1, 2, [['~', RootPointer, 2]]],
      [1, -1, [['~', RootPointer, -1]]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('string -> string', () => {
    test.for([
      ['', '', []],
      ['a', 'a', []],
      ['', 'a', [['~', RootPointer, 'a']]],
      ['a', 'b', [['~', RootPointer, 'b']]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('function -> function', () => {
    test.for([
      [funcA, funcA, []],
      [function () {}, function () {}, []],
      [funcA, funcB, [['~', RootPointer, funcB]]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(serialize(apply(patch!, a))).toEqual(serialize(b));
    });
  });
  describe('object -> object', () => {
    test.for([
      [{}, {}, []],
      [{ a: 'a' }, { a: 'b' }, [['~', RootPointer.extend('a'), 'b']]],
      [{ a: 'a' }, { a: { b: 'c' } }, [['~', RootPointer.extend('a'), { b: 'c' }]]],
      [{ a: { b: 'c' } }, { a: { b: 'd' } }, [['~', RootPointer.extend('a').extend('b'), 'd']]],
      [
        { a: 'a', b: 'b' },
        { a: 'b', b: 'a' },
        [
          ['~', RootPointer.extend('a'), 'b'],
          ['~', RootPointer.extend('b'), 'a'],
        ],
      ],
      [{}, { a: 'b' }, [['+', RootPointer.extend('a'), 'b']]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('symbol -> symbol', () => {
    test.for([
      [symbolA, symbolA, []],
      [symbolA, symbolB, [['~', RootPointer, symbolB]]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('array -> array', () => {
    test.for([
      [[], [], []],
      [[1], [1, 2], [['+', RootPointer.extend(1), 2]]],
      [[objA, 2, 3], [objB, 2, 3], [['~', RootPointer.extend(0), objB]]],
      [[1, 2, 3], [2, 1, 3], [['~', RootPointer, [2, 1, 3]]]],
      [[1, 2, 3], [1, 3], [['-', RootPointer.extend(1)]]],
      [[objA], [objA, objA], [['^', RootPointer.extend(0), RootPointer.extend(1)]]],
      [[objA, 1], [objA, 1, objA], [['^', RootPointer.extend(0), RootPointer.extend(2)]]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('undefined -> any', () => {
    test.for([
      [undefined, null, [['+', RootPointer, null]]],
      [undefined, 1, [['+', RootPointer, 1]]],
      [undefined, '1', [['+', RootPointer, '1']]],
      [undefined, funcA, [['+', RootPointer, funcA]]],
      [undefined, {}, [['+', RootPointer, {}]]],
      [undefined, symbolA, [['+', RootPointer, symbolA]]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('null -> any', () => {
    test.for([
      [null, undefined, [['-', RootPointer]]],
      [null, 1, [['~', RootPointer, 1]]],
      [null, '1', [['~', RootPointer, '1']]],
      [null, funcA, [['~', RootPointer, funcA]]],
      [null, {}, [['~', RootPointer, {}]]],
      [null, symbolA, [['~', RootPointer, symbolA]]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('boolean -> any', () => {
    test.for([
      [true, undefined, [['-', RootPointer]]],
      [true, null, [['~', RootPointer, null]]],
      [true, 1, [['~', RootPointer, 1]]],
      [true, '1', [['~', RootPointer, '1']]],
      [true, funcA, [['~', RootPointer, funcA]]],
      [true, {}, [['~', RootPointer, {}]]],
      [true, symbolA, [['~', RootPointer, symbolA]]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('number -> any', () => {
    test.for([
      [1, undefined, [['-', RootPointer]]],
      [1, null, [['~', RootPointer, null]]],
      [1, true, [['~', RootPointer, true]]],
      [1, '1', [['~', RootPointer, '1']]],
      [1, funcA, [['~', RootPointer, funcA]]],
      [1, {}, [['~', RootPointer, {}]]],
      [1, symbolA, [['~', RootPointer, symbolA]]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('string -> any', () => {
    test.for([
      ['1', undefined, [['-', RootPointer]]],
      ['1', null, [['~', RootPointer, null]]],
      ['1', true, [['~', RootPointer, true]]],
      ['1', 1, [['~', RootPointer, 1]]],
      ['1', funcA, [['~', RootPointer, funcA]]],
      ['1', {}, [['~', RootPointer, {}]]],
      ['1', symbolA, [['~', RootPointer, symbolA]]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('function -> any', () => {
    test.for([
      [funcA, undefined, [['-', RootPointer]]],
      [funcA, null, [['~', RootPointer, null]]],
      [funcA, true, [['~', RootPointer, true]]],
      [funcA, 1, [['~', RootPointer, 1]]],
      [funcA, '1', [['~', RootPointer, '1']]],
      [funcA, {}, [['~', RootPointer, {}]]],
      [funcA, symbolA, [['~', RootPointer, symbolA]]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
  describe('object -> any', () => {
    test.for([
      [{}, undefined, [['-', RootPointer]]],
      [{}, null, [['~', RootPointer, null]]],
      [{}, true, [['~', RootPointer, true]]],
      [{}, 1, [['~', RootPointer, 1]]],
      [{}, '1', [['~', RootPointer, '1']]],
      [{}, funcA, [['~', RootPointer, funcA]]],
      [{}, symbolA, [['~', RootPointer, symbolA]]],
    ])('(%s, %s) -> %s', ([a, b, expected], { expect }) => {
      const patch = diff(a, b);
      expect(patch).toEqual(expected);
      expect(apply(patch!, a)).toEqual(b);
    });
  });
});
