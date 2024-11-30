import { describe, test } from 'vitest';
import { clone } from './clone';

describe('primitive', () => {
  test.for([[null], [undefined], [123], ['string'], [BigInt(123)], [function () {}], [Symbol('symbol')]])(
    '%s',
    ([value], { expect }) => {
      expect(clone(value, {})).toEqual(value);
    }
  );
});

describe('array', () => {
  test.for([[[]], [[null, undefined, 123, 'string', BigInt(123), function () {}, Symbol('symbol')]]])(
    '%s',
    ([value], { expect }) => {
      const cloned = clone(value, {});
      // Equal in content
      expect(cloned).toEqual(value);
      // But not in reference
      expect(cloned).not.toBe(value);
    }
  );
});

test('custom', ({ expect }) => {
  class Test {
    constructor(private readonly val: string) {}

    clone() {
      return new Test(this.val);
    }
  }

  const value = new Test('hi');
  const cloned = clone(value, {});
  // Equal in content
  expect(cloned).toEqual(value);
  // But not in reference
  expect(cloned).not.toBe(value);
});

describe('JS Natives', () => {
  test.for([
    [new String('hi')],
    [new Boolean(true)],
    [new Number(1)],
    [new Set([null, undefined, 123, 'string', BigInt(123), function () {}, Symbol('symbol')])],
    [
      new Map([
        ['null', null],
        ['undefined', undefined],
        ['number', 123],
        ['string', 'string'],
        ['bigint', BigInt(123)],
        ['function', function () {}],
        ['symbol', Symbol('symbol')],
      ] as [string, any][]),
    ],
    [new Date(1234)],
    [new Error('some error')],
    [new RegExp('some(.+?)val', 'g')],
    [/some(.+?)val/g],
    [new Uint8Array([1, 2, 3])],
    [new Uint16Array([1, 2, 3])],
    [new Uint32Array([1, 2, 3])],
  ])('%s', ([value], { expect }) => {
    const cloned = clone(value, {});
    // Equal in content
    expect(cloned).toEqual(value);
    // But not in reference
    expect(cloned).not.toBe(value);
  });

  test.for([[new Function('return "hi"')]])('%s', ([value], { expect }) => {
    const cloned = clone(value, {});
    // Equal in content
    expect(cloned).toEqual(value);
    // and in reference
    expect(cloned).toBe(value);
  });
});

describe('object', () => {
  class A {
    constructor(private readonly val: string) {}
  }

  const a: { b: any } = { b: undefined };
  a.b = a;

  test.for([[{}], [{ a: 'b' }], [{ a: { b: 'c' } }], [{ [Symbol('test')]: 'b' }], [new A('test')], [a]])(
    '%s',
    ([value], { expect }) => {
      const cloned = clone(value, {});
      // Equal in content
      expect(cloned).toEqual(value);
      // But not in reference
      expect(cloned).not.toBe(value);
    }
  );
});

test('override', ({ expect }) => {
  const v = { a: '1' };
  const cloned = clone(v, {
    clone(v, opts) {
      if (isNaN(v)) opts.skip();
      return Number(v);
    },
  });
  expect(cloned).toEqual({ a: 1 });
});
