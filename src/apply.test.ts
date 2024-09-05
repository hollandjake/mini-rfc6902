import { describe, test } from 'vitest';
import { apply } from './apply';
import { Patch } from './patch';
import { Pointer } from './pointer';

/**
 * https://datatracker.ietf.org/doc/html/rfc6902#appendix-A
 */
describe('Spec Compliance', () => {
  describe('A.1 - Adding an Object Member', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'add', path: Pointer.from('/baz'), value: 'qux' }]],
      ['Maxi + String', [{ op: 'add', path: '/baz', value: 'qux' }]],
      ['Mini + Pointer', [['+', Pointer.from('/baz'), 'qux']]],
      ['Mini + String', [['+', '/baz', 'qux']]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: 'bar' };
      expect(apply(patch, a)).toEqual({ foo: 'bar', baz: 'qux' });
      expect(a).toEqual({ foo: 'bar' });
    });
  });
  describe('A.2 - Adding an Array Element', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'add', path: Pointer.from('/foo/1'), value: 'qux' }]],
      ['Maxi + String', [{ op: 'add', path: '/foo/1', value: 'qux' }]],
      ['Mini + Pointer', [['+', Pointer.from('/foo/1'), 'qux']]],
      ['Mini + String', [['+', '/foo/1', 'qux']]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: ['bar', 'baz'] };
      expect(apply(patch, a)).toEqual({ foo: ['bar', 'qux', 'baz'] });
      expect(a).toEqual({ foo: ['bar', 'baz'] });
    });
  });
  describe('A.3 - Removing an Object Member', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'remove', path: Pointer.from('/baz') }]],
      ['Maxi + String', [{ op: 'remove', path: '/baz' }]],
      ['Mini + Pointer', [['-', Pointer.from('/baz')]]],
      ['Mini + String', [['-', '/baz']]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { baz: 'qux', foo: 'bar' };
      expect(apply(patch, a)).toEqual({ foo: 'bar' });
      expect(a).toEqual({ baz: 'qux', foo: 'bar' });
    });
  });
  describe('A.4 - Removing an Array Element', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'remove', path: Pointer.from('/foo/1') }]],
      ['Maxi + String', [{ op: 'remove', path: '/foo/1' }]],
      ['Mini + Pointer', [['-', Pointer.from('/foo/1')]]],
      ['Mini + String', [['-', '/foo/1']]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: ['bar', 'qux', 'baz'] };
      expect(apply(patch, a)).toEqual({ foo: ['bar', 'baz'] });
      expect(a).toEqual({ foo: ['bar', 'qux', 'baz'] });
    });
  });
  describe('A.5 - Replacing a Value', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'replace', path: Pointer.from('/baz'), value: 'boo' }]],
      ['Maxi + String', [{ op: 'replace', path: '/baz', value: 'boo' }]],
      ['Mini + Pointer', [['~', Pointer.from('/baz'), 'boo']]],
      ['Mini + String', [['~', '/baz', 'boo']]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { baz: 'qux', foo: 'bar' };
      expect(apply(patch, a)).toEqual({ baz: 'boo', foo: 'bar' });
      expect(a).toEqual({ baz: 'qux', foo: 'bar' });
    });
  });
  describe('A.6 - Moving a Value', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'move', from: Pointer.from('/foo/waldo'), path: Pointer.from('/qux/thud') }]],
      ['Maxi + String', [{ op: 'move', from: '/foo/waldo', path: '/qux/thud' }]],
      ['Mini + Pointer', [['>', Pointer.from('/foo/waldo'), Pointer.from('/qux/thud')]]],
      ['Mini + String', [['>', '/foo/waldo', '/qux/thud']]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: { bar: 'baz', waldo: 'fred' }, qux: { corge: 'grault' } };
      expect(apply(patch, a)).toEqual({ foo: { bar: 'baz' }, qux: { corge: 'grault', thud: 'fred' } });
      expect(a).toEqual({ foo: { bar: 'baz', waldo: 'fred' }, qux: { corge: 'grault' } });
    });
  });
  describe('A.7 - Moving an Array Element', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'move', from: Pointer.from('/foo/1'), path: Pointer.from('/foo/3') }]],
      ['Maxi + String', [{ op: 'move', from: '/foo/1', path: '/foo/3' }]],
      ['Mini + Pointer', [['>', Pointer.from('/foo/1'), Pointer.from('/foo/3')]]],
      ['Mini + String', [['>', '/foo/1', '/foo/3']]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: ['all', 'grass', 'cows', 'eat'] };
      expect(apply(patch, a)).toEqual({ foo: ['all', 'cows', 'eat', 'grass'] });
      expect(a).toEqual({ foo: ['all', 'grass', 'cows', 'eat'] });
    });
  });
  describe('A.8 - Testing a Value: Success', () => {
    test.for([
      [
        'Maxi + Pointer',
        [
          { op: 'test', path: Pointer.from('/baz'), value: 'qux' },
          { op: 'test', path: Pointer.from('/foo/1'), value: 2 },
        ],
      ],
      [
        'Maxi + String',
        [
          { op: 'test', path: '/baz', value: 'qux' },
          { op: 'test', path: '/foo/1', value: 2 },
        ],
      ],
      [
        'Mini + Pointer',
        [
          ['?', Pointer.from('/baz'), 'qux'],
          ['?', Pointer.from('/foo/1'), 2],
        ],
      ],
      [
        'Mini + String',
        [
          ['?', '/baz', 'qux'],
          ['?', '/foo/1', 2],
        ],
      ],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { baz: 'qux', foo: ['a', 2, 'c'] };
      expect(() => apply(patch, a)).not.toThrow();
      expect(a).toEqual({ baz: 'qux', foo: ['a', 2, 'c'] });
    });
  });
  describe('A.9 - Testing a Value: Error', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'test', from: Pointer.from('/baz'), value: 'bar' }]],
      ['Maxi + String', [{ op: 'test', from: '/baz', value: 'bar' }]],
      ['Mini + Pointer', [['?', Pointer.from('/baz'), 'bar']]],
      ['Mini + String', [['?', '/baz', 'bar']]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { baz: 'qux' };
      expect(() => apply(patch, a)).toThrow();
      expect(a).toEqual({ baz: 'qux' });
    });
  });
  describe('A.10 - Adding a Nested Member Object', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'add', path: Pointer.from('/child'), value: { grandchild: {} } }]],
      ['Maxi + String', [{ op: 'add', path: '/child', value: { grandchild: {} } }]],
      ['Mini + Pointer', [['+', Pointer.from('/child'), { grandchild: {} }]]],
      ['Mini + String', [['+', '/child', { grandchild: {} }]]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: 'bar' };
      expect(apply(patch, a)).toEqual({ foo: 'bar', child: { grandchild: {} } });
      expect(a).toEqual({ foo: 'bar' });
    });
  });
  describe('A.11 - Ignoring Unrecognized Elements', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'add', path: Pointer.from('/baz'), value: 'qux', xyz: 123 } as never]],
      ['Maxi + String', [{ op: 'add', path: '/baz', value: 'qux', xyz: 123 } as never]],
      ['Mini + Pointer', [['+', Pointer.from('/baz'), 'qux', 123] as never]],
      ['Mini + String', [['+', '/baz', 'qux', 123] as never]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: 'bar' };
      expect(apply(patch, a)).toEqual({ foo: 'bar', baz: 'qux' });
      expect(a).toEqual({ foo: 'bar' });
    });
  });
  describe('A.12 - Adding to a Nonexistent Target', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'add', path: Pointer.from('/baz/bat'), value: 'qux' }]],
      ['Maxi + String', [{ op: 'add', path: '/baz/bat', value: 'qux' }]],
      ['Mini + Pointer', [['+', Pointer.from('/baz/bat'), 'qux']]],
      ['Mini + String', [['+', '/baz/bat', 'qux']]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: 'bar' };
      expect(() => apply(patch, a)).toThrow();
      expect(a).toEqual({ foo: 'bar' });
    });
  });
  describe('A.13 - Invalid JSON Patch Document', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'INVALID', path: Pointer.from('/baz'), value: 'qux' } as never]],
      ['Maxi + String', [{ op: 'INVALID', path: '/baz', value: 'qux' } as never]],
      ['Mini + Pointer', [['INVALID', Pointer.from('/baz'), 'qux'] as never]],
      ['Mini + String', [['INVALID', '/baz', 'qux'] as never]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: 'bar' };
      expect(() => apply(patch, a)).toThrow();
      expect(a).toEqual({ foo: 'bar' });
    });
  });
  describe('A.14 - ~ Escape Ordering', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'test', path: Pointer.from('/~01'), value: 10 }]],
      ['Maxi + String', [{ op: 'test', path: '/~01', value: 10 }]],
      ['Mini + Pointer', [['?', Pointer.from('/~01'), 10]]],
      ['Mini + String', [['?', '/~01', 10]]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { '/': 9, '~1': 10 };
      expect(() => apply(patch, a)).not.toThrow();
      expect(a).toEqual({ '/': 9, '~1': 10 });
    });
  });
  describe('A.15 - Comparing Strings and Numbers', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'test', path: Pointer.from('/~01'), value: '10' }]],
      ['Maxi + String', [{ op: 'test', path: '/~01', value: '10' }]],
      ['Mini + Pointer', [['?', Pointer.from('/~01'), '10']]],
      ['Mini + String', [['?', '/~01', '10']]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { '/': 9, '~1': 10 };
      expect(() => apply(patch, a)).toThrow();
      expect(a).toEqual({ '/': 9, '~1': 10 });
    });
  });
  describe('A.16 - Adding an Array Value', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'add', path: Pointer.from('/foo/-'), value: ['abc', 'def'] }]],
      ['Maxi + String', [{ op: 'add', path: '/foo/-', value: ['abc', 'def'] }]],
      ['Mini + Pointer', [['+', Pointer.from('/foo/-'), ['abc', 'def']]]],
      ['Mini + String', [['+', '/foo/-', ['abc', 'def']]]],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: ['bar'] };
      expect(apply(patch, a)).toEqual({ foo: ['bar', ['abc', 'def']] });
      expect(a).toEqual({ foo: ['bar'] });
    });
  });
});

describe('Extended Spec', () => {
  test('E.1 - Function support', ({ expect }) => {
    function someFunc() {}

    const a = { foo: someFunc };
    expect(apply([['^', '/foo', '/bar']], a)).toEqual({
      foo: someFunc,
      bar: someFunc,
    });
  });
  test('E.2 - Patch values are cloned', ({ expect }) => {
    const a = {};
    const obj = { bar: 'baz' };

    expect(
      apply(
        [
          ['+', '/foo', obj],
          ['~', '/foo/bar', 'qux'],
        ],
        a
      )
    ).toEqual({ foo: { bar: 'qux' } });

    expect(obj).toEqual({ bar: 'baz' });
  });
});
