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
      ['Serial', Buffer.from('JQAAAAIwAAIAAAArAAIxAAUAAAAvYmF6AAIyAAQAAABxdXgAAA==', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: 'bar' };
      expect(apply(a, patch)).toEqual({ foo: 'bar', baz: 'qux' });
      expect(a).toEqual({ foo: 'bar' });
    });
  });
  describe('A.2 - Adding an Array Element', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'add', path: Pointer.from('/foo/1'), value: 'qux' }]],
      ['Maxi + String', [{ op: 'add', path: '/foo/1', value: 'qux' }]],
      ['Mini + Pointer', [['+', Pointer.from('/foo/1'), 'qux']]],
      ['Mini + String', [['+', '/foo/1', 'qux']]],
      ['Serial', Buffer.from('JwAAAAIwAAIAAAArAAIxAAcAAAAvZm9vLzEAAjIABAAAAHF1eAAA', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: ['bar', 'baz'] };
      expect(apply(a, patch)).toEqual({ foo: ['bar', 'qux', 'baz'] });
      expect(a).toEqual({ foo: ['bar', 'baz'] });
    });
  });
  describe('A.3 - Removing an Object Member', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'remove', path: Pointer.from('/baz') }]],
      ['Maxi + String', [{ op: 'remove', path: '/baz' }]],
      ['Mini + Pointer', [['-', Pointer.from('/baz')]]],
      ['Mini + String', [['-', '/baz']]],
      ['Serial', Buffer.from('GgAAAAIwAAIAAAAtAAIxAAUAAAAvYmF6AAA=', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { baz: 'qux', foo: 'bar' };
      expect(apply(a, patch)).toEqual({ foo: 'bar' });
      expect(a).toEqual({ baz: 'qux', foo: 'bar' });
    });
  });
  describe('A.4 - Removing an Array Element', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'remove', path: Pointer.from('/foo/1') }]],
      ['Maxi + String', [{ op: 'remove', path: '/foo/1' }]],
      ['Mini + Pointer', [['-', Pointer.from('/foo/1')]]],
      ['Mini + String', [['-', '/foo/1']]],
      ['Serial', Buffer.from('HAAAAAIwAAIAAAAtAAIxAAcAAAAvZm9vLzEAAA==', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: ['bar', 'qux', 'baz'] };
      expect(apply(a, patch)).toEqual({ foo: ['bar', 'baz'] });
      expect(a).toEqual({ foo: ['bar', 'qux', 'baz'] });
    });
  });
  describe('A.5 - Replacing a Value', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'replace', path: Pointer.from('/baz'), value: 'boo' }]],
      ['Maxi + String', [{ op: 'replace', path: '/baz', value: 'boo' }]],
      ['Mini + Pointer', [['~', Pointer.from('/baz'), 'boo']]],
      ['Mini + String', [['~', '/baz', 'boo']]],
      ['Serial', Buffer.from('JQAAAAIwAAIAAAB+AAIxAAUAAAAvYmF6AAIyAAQAAABib28AAA==', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { baz: 'qux', foo: 'bar' };
      expect(apply(a, patch)).toEqual({ baz: 'boo', foo: 'bar' });
      expect(a).toEqual({ baz: 'qux', foo: 'bar' });
    });
  });
  describe('A.6 - Moving a Value', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'move', from: Pointer.from('/foo/waldo'), path: Pointer.from('/qux/thud') }]],
      ['Maxi + String', [{ op: 'move', from: '/foo/waldo', path: '/qux/thud' }]],
      ['Mini + Pointer', [['>', Pointer.from('/foo/waldo'), Pointer.from('/qux/thud')]]],
      ['Mini + String', [['>', '/foo/waldo', '/qux/thud']]],
      ['Serial', Buffer.from('MQAAAAIwAAIAAAA+AAIxAAsAAAAvZm9vL3dhbGRvAAIyAAoAAAAvcXV4L3RodWQAAA==', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: { bar: 'baz', waldo: 'fred' }, qux: { corge: 'grault' } };
      expect(apply(a, patch)).toEqual({ foo: { bar: 'baz' }, qux: { corge: 'grault', thud: 'fred' } });
      expect(a).toEqual({ foo: { bar: 'baz', waldo: 'fred' }, qux: { corge: 'grault' } });
    });
  });
  describe('A.7 - Moving an Array Element', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'move', from: Pointer.from('/foo/1'), path: Pointer.from('/foo/3') }]],
      ['Maxi + String', [{ op: 'move', from: '/foo/1', path: '/foo/3' }]],
      ['Mini + Pointer', [['>', Pointer.from('/foo/1'), Pointer.from('/foo/3')]]],
      ['Mini + String', [['>', '/foo/1', '/foo/3']]],
      ['Serial', Buffer.from('KgAAAAIwAAIAAAA+AAIxAAcAAAAvZm9vLzEAAjIABwAAAC9mb28vMwAA', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: ['all', 'grass', 'cows', 'eat'] };
      expect(apply(a, patch)).toEqual({ foo: ['all', 'cows', 'eat', 'grass'] });
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
      [
        'Serial',
        Buffer.from(
          'JQAAAAIwAAIAAAA/AAIxAAUAAAAvYmF6AAIyAAQAAABxdXgAACMAAAACMAACAAAAPwACMQAHAAAAL2Zvby8xABAyAAIAAAAA',
          'base64',
        ),
      ],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { baz: 'qux', foo: ['a', 2, 'c'] };
      expect(() => apply(a, patch)).not.toThrow();
      expect(a).toEqual({ baz: 'qux', foo: ['a', 2, 'c'] });
    });
  });
  describe('A.9 - Testing a Value: Error', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'test', from: Pointer.from('/baz'), value: 'bar' }]],
      ['Maxi + String', [{ op: 'test', from: '/baz', value: 'bar' }]],
      ['Mini + Pointer', [['?', Pointer.from('/baz'), 'bar']]],
      ['Mini + String', [['?', '/baz', 'bar']]],
      ['Serial', Buffer.from('JQAAAAIwAAIAAAA/AAIxAAUAAAAvYmF6AAIyAAQAAABiYXIAAA==', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { baz: 'qux' };
      expect(() => apply(a, patch)).toThrow();
      expect(a).toEqual({ baz: 'qux' });
    });
  });
  describe('A.10 - Adding a Nested Member Object', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'add', path: Pointer.from('/child'), value: { grandchild: {} } }]],
      ['Maxi + String', [{ op: 'add', path: '/child', value: { grandchild: {} } }]],
      ['Mini + Pointer', [['+', Pointer.from('/child'), { grandchild: {} }]]],
      ['Mini + String', [['+', '/child', { grandchild: {} }]]],
      ['Serial', Buffer.from('NQAAAAIwAAIAAAArAAIxAAcAAAAvY2hpbGQAAzIAFgAAAANncmFuZGNoaWxkAAUAAAAAAAA=', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: 'bar' };
      expect(apply(a, patch)).toEqual({ foo: 'bar', child: { grandchild: {} } });
      expect(a).toEqual({ foo: 'bar' });
    });
  });
  describe('A.11 - Ignoring Unrecognized Elements', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'add', path: Pointer.from('/baz'), value: 'qux', xyz: 123 } as never]],
      ['Maxi + String', [{ op: 'add', path: '/baz', value: 'qux', xyz: 123 } as never]],
      ['Mini + Pointer', [['+', Pointer.from('/baz'), 'qux', 123] as never]],
      ['Mini + String', [['+', '/baz', 'qux', 123] as never]],
      ['Serial', Buffer.from('LAAAAAIwAAIAAAArAAIxAAUAAAAvYmF6AAIyAAQAAABxdXgAEDMAewAAAAA=', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: 'bar' };
      expect(apply(a, patch)).toEqual({ foo: 'bar', baz: 'qux' });
      expect(a).toEqual({ foo: 'bar' });
    });
  });
  describe('A.12 - Adding to a Nonexistent Target', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'add', path: Pointer.from('/baz/bat'), value: 'qux' }]],
      ['Maxi + String', [{ op: 'add', path: '/baz/bat', value: 'qux' }]],
      ['Mini + Pointer', [['+', Pointer.from('/baz/bat'), 'qux']]],
      ['Mini + String', [['+', '/baz/bat', 'qux']]],
      ['Serial', Buffer.from('KQAAAAIwAAIAAAArAAIxAAkAAAAvYmF6L2JhdAACMgAEAAAAcXV4AAA=', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: 'bar' };

      expect(() => apply(a, patch)).toThrow();
      expect(a).toEqual({ foo: 'bar' });
    });
  });
  describe('A.13 - Invalid JSON Patch Document', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'INVALID', path: Pointer.from('/baz'), value: 'qux' } as never]],
      ['Maxi + String', [{ op: 'INVALID', path: '/baz', value: 'qux' } as never]],
      ['Mini + Pointer', [['INVALID', Pointer.from('/baz'), 'qux'] as never]],
      ['Mini + String', [['INVALID', '/baz', 'qux'] as never]],
      ['Serial + Structured', Buffer.from('KwAAAAIwAAgAAABJTlZBTElEAAIxAAUAAAAvYmF6AAIyAAQAAABxdXgAAA==', 'base64')],
      ['Serial + Random', Buffer.from('rO1VnS+aI4Kw/64n/fVc/Q==', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: 'bar' };
      expect(() => apply(a, patch)).toThrow();
      expect(a).toEqual({ foo: 'bar' });
    });
  });
  describe('A.14 - ~ Escape Ordering', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'test', path: Pointer.from('/~01'), value: 10 }]],
      ['Maxi + String', [{ op: 'test', path: '/~01', value: 10 }]],
      ['Mini + Pointer', [['?', Pointer.from('/~01'), 10]]],
      ['Mini + String', [['?', '/~01', 10]]],
      ['Serial', Buffer.from('IQAAAAIwAAIAAAA/AAIxAAUAAAAvfjAxABAyAAoAAAAA', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { '/': 9, '~1': 10 };
      expect(() => apply(a, patch)).not.toThrow();
      expect(a).toEqual({ '/': 9, '~1': 10 });
    });
  });
  describe('A.15 - Comparing Strings and Numbers', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'test', path: Pointer.from('/~01'), value: '10' }]],
      ['Maxi + String', [{ op: 'test', path: '/~01', value: '10' }]],
      ['Mini + Pointer', [['?', Pointer.from('/~01'), '10']]],
      ['Mini + String', [['?', '/~01', '10']]],
      ['Serial', Buffer.from('JAAAAAIwAAIAAAA/AAIxAAUAAAAvfjAxAAIyAAMAAAAxMAAA', 'base64')],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { '/': 9, '~1': 10 };
      expect(() => apply(a, patch)).toThrow();
      expect(a).toEqual({ '/': 9, '~1': 10 });
    });
  });
  describe('A.16 - Adding an Array Value', () => {
    test.for([
      ['Maxi + Pointer', [{ op: 'add', path: Pointer.from('/foo/-'), value: ['abc', 'def'] }]],
      ['Maxi + String', [{ op: 'add', path: '/foo/-', value: ['abc', 'def'] }]],
      ['Mini + Pointer', [['+', Pointer.from('/foo/-'), ['abc', 'def']]]],
      ['Mini + String', [['+', '/foo/-', ['abc', 'def']]]],
      [
        'Serial',
        Buffer.from('OgAAAAIwAAIAAAArAAIxAAcAAAAvZm9vLy0ABDIAGwAAAAIwAAQAAABhYmMAAjEABAAAAGRlZgAAAA==', 'base64'),
      ],
    ] as [string, Patch][])('%s', ([, patch], { expect }) => {
      const a = { foo: ['bar'] };
      expect(apply(a, patch)).toEqual({ foo: ['bar', ['abc', 'def']] });
      expect(a).toEqual({ foo: ['bar'] });
    });
  });
});

describe('Extended Spec', () => {
  test('E.1 - Function support', ({ expect }) => {
    function someFunc() {}

    const a = { foo: someFunc };
    expect(apply(a, [['^', '/foo', '/bar']])).toEqual({
      foo: someFunc,
      bar: someFunc,
    });
  });
  test('E.2 - Patch values are cloned', ({ expect }) => {
    const a = {};
    const obj = { bar: 'baz' };

    expect(
      apply(a, [
        ['+', '/foo', obj],
        ['~', '/foo/bar', 'qux'],
      ]),
    ).toEqual({ foo: { bar: 'qux' } });

    expect(obj).toEqual({ bar: 'baz' });
  });
  describe('E.3 - Replace root', () => {
    test.for([[null], [undefined], [true], [function () {}], ['a'], [0], [[]], [{ a: 'a' }], [new Date(0)]])(
      '%o -> {}',
      ([a], { expect }) => {
        expect(apply(a, [['~', '', {}]])).toEqual({});
      },
    );
  });
});
