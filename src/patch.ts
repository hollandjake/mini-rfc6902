import { InvalidOperationError, InvalidPatchError } from './error';
import { Pointer } from './pointer';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Mini {
  export type AddOp<V = any> = [op: '+', path: Pointer | string, value: V];
  export type RemoveOp = [op: '-', path: Pointer | string];
  export type ReplaceOp<V = any> = [op: '~', path: Pointer | string, value: V];
  export type MoveOp = [op: '>', from: Pointer | string, to: Pointer | string];
  export type CopyOp = [op: '^', from: Pointer | string, to: Pointer | string];
  export type TestOp<V = any> = [op: '?', path: Pointer | string, value: V];
  export type Op = AddOp | RemoveOp | ReplaceOp | MoveOp | CopyOp | TestOp;
  export type Patch = Op[];
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Maxi {
  export type AddOp<V = any> = { op: 'add'; path: Pointer | string; value: V };
  export type RemoveOp = { op: 'remove'; path: Pointer | string };
  export type ReplaceOp<V = any> = { op: 'replace'; path: Pointer | string; value: V };
  export type MoveOp = { op: 'move'; from: Pointer | string; path: Pointer | string };
  export type CopyOp = { op: 'copy'; from: Pointer | string; path: Pointer | string };
  export type TestOp<V = any> = { op: 'test'; path: Pointer | string; value: V };
  export type Op = AddOp | RemoveOp | ReplaceOp | MoveOp | CopyOp | TestOp;
  export type Patch = Op[];
}

export type Op = Mini.Op | Maxi.Op;
export type Patch = Op[];

export function minify(patch: Patch): Mini.Patch {
  if (!Array.isArray(patch)) throw new InvalidPatchError(patch);
  return patch.map(minifyOp);
}

export function minifyOp(op: Op): Mini.Op {
  if (isMinified(op)) return op;
  if (!isMaximised(op)) throw new InvalidOperationError(op);
  switch (op.op) {
    case 'add':
      return ['+', op.path, op.value];
    case 'remove':
      return ['-', op.path];
    case 'replace':
      return ['~', op.path, op.value];
    case 'move':
      return ['>', op.from, op.path];
    case 'copy':
      return ['^', op.from, op.path];
    case 'test':
      return ['?', op.path, op.value];
  }
}

export function maximize(patch: Patch): Maxi.Patch {
  if (!Array.isArray(patch)) throw new InvalidPatchError(patch);
  return patch.map(maximizeOp);
}

export function maximizeOp(op: Op): Maxi.Op {
  if (isMaximised(op)) return op;
  if (!isMinified(op)) throw new InvalidOperationError(op);
  switch (op[0]) {
    case '+':
      return { op: 'add', path: op[1], value: op[2] };
    case '-':
      return { op: 'remove', path: op[1] };
    case '~':
      return { op: 'replace', path: op[1], value: op[2] };
    case '>':
      return { op: 'move', from: op[1], path: op[2] };
    case '^':
      return { op: 'copy', from: op[1], path: op[2] };
    case '?':
      return { op: 'test', path: op[1], value: op[2] };
  }
}

function isPointerable(x: unknown): x is Pointer | string {
  if (x === null || x === undefined) return false;
  if (typeof x === 'string') return true;
  if (x instanceof Pointer) return true;
  if (x instanceof Uint8Array) return true;
  return typeof x === 'object' && 'buffer' in x && x['buffer'] instanceof Uint8Array;
}

function isMinified(op: Op): op is Mini.Op {
  if (!op) return false;
  if (!Array.isArray(op)) return false;
  if (!op.length) return false;

  switch (op[0]) {
    case '+':
    case '~':
    case '?':
      return op.length >= 3 && isPointerable(op[1]);
    case '-':
      return op.length >= 2 && isPointerable(op[1]);
    case '>':
    case '^':
      return op.length >= 3 && isPointerable(op[1]) && isPointerable(op[2]);
    default:
      return false;
  }
}

function isMaximised(op: Op): op is Maxi.Op {
  if (!op) return false;
  if (typeof op !== 'object') return false;
  if (!('op' in op)) return false;
  if (!('path' in op)) return false;

  switch (op['op']) {
    case 'add':
    case 'replace':
    case 'test':
      return isPointerable(op['path']) && 'value' in op;
    case 'remove':
      return isPointerable(op['path']);
    case 'move':
    case 'copy':
      return isPointerable(op['path']) && 'from' in op && isPointerable(op['from']);
    default:
      return false;
  }
}
