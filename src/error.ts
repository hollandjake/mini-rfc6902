import { Op } from './patch';
import { Pointer } from './pointer';

export class PointerError extends Error {}

export class MissingError extends Error {
  constructor(public ptr: Pointer) {
    super(`Value required at path: '${ptr}'`);
    this.name = 'MissingError';
  }
}

export class TestError extends Error {
  constructor(
    public actual: unknown,
    public expected: unknown,
  ) {
    super(`Test failed: '${actual}' !== '${expected}'`);
    this.name = 'TestError';
  }
}

export class InvalidOperationError extends Error {
  constructor(public op: Op) {
    super(`Invalid operation: '${JSON.stringify(op)}'`);
    this.name = 'InvalidOperationError';
  }
}

export class InvalidPatchError extends Error {
  constructor(public patch: any) {
    super(`Invalid patch: '${patch}'`);
    this.name = 'InvalidPatchError';
  }
}

export class UnserializableError extends Error {
  constructor(message: any) {
    super(message);
    this.name = 'UnserializableError';
  }
}
