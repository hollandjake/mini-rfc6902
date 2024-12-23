import { Op } from './patch.js';

export class PointerError extends Error {}

export class MissingError extends Error {
  name = 'MissingError';

  constructor(public ptr: { toString: () => string }) {
    super(`Value required at path: '${ptr.toString()}'`);
  }
}

export class TestError extends Error {
  name = 'TestError';

  constructor(
    public actual: unknown,
    public expected: unknown
  ) {
    super(`Test failed: '${actual}' !== '${expected}'`);
  }
}

export class InvalidOperationError extends Error {
  name = 'InvalidOperationError';

  constructor(public op: Op) {
    super(`Invalid operation: '${JSON.stringify(op)}'`);
  }
}
