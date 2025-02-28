import { Op } from './patch';

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
    public expected: unknown,
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

export class InvalidPatchError extends Error {
  name = 'InvalidPatchError';

  constructor(public patch: any) {
    super(`Invalid patch: '${patch}'`);
  }
}

export class UnserializableError extends Error {
  name = 'UnserializableError';
}
