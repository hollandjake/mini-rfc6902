import { InvalidOperationError, InvalidPatchError, UnserializableError } from './error';
import { Pointer } from './pointer';
import { eq, getInt32LE } from './utils';
import { deserializeBSON, serializeBSON } from './utils/bson.cjs';

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

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Serial {
  export type Op = Uint8Array;
  export type Patch = Uint8Array;
}

export type Op = Mini.Op | Maxi.Op | Serial.Op;
export type MaxiPatch = Maxi.Patch;
export type MiniPatch = Mini.Patch;
export type SerialPatch = Serial.Patch;
export type Patch = Op[] | SerialPatch;

export function minify(patch: Patch): MiniPatch {
  if (patch instanceof Uint8Array) return deserialize(patch);
  if (!Array.isArray(patch)) throw new InvalidPatchError(patch);
  return patch.map(minifyOp);
}

export function minifyOp(op: Op): Mini.Op {
  if (isMinified(op)) return op;
  if (op instanceof Uint8Array) return deserializeOp(op);
  if (!isMaximised(op)) throw new InvalidOperationError(op);
  switch (op.op) {
    case 'add':
      return ['+', Pointer.from(op.path), op.value];
    case 'remove':
      return ['-', Pointer.from(op.path)];
    case 'replace':
      return ['~', Pointer.from(op.path), op.value];
    case 'move':
      return ['>', Pointer.from(op.from), Pointer.from(op.path)];
    case 'copy':
      return ['^', Pointer.from(op.from), Pointer.from(op.path)];
    case 'test':
      return ['?', Pointer.from(op.path), op.value];
  }
}

export function maximize(patch: Patch): MaxiPatch {
  if (patch instanceof Uint8Array) patch = deserialize(patch);
  else if (!Array.isArray(patch)) throw new InvalidPatchError(patch);
  return patch.map(maximizeOp);
}

export function maximizeOp(op: Op): Maxi.Op {
  if (isMaximised(op)) return op;
  if (op instanceof Uint8Array) op = deserializeOp(op);
  if (!isMinified(op)) throw new InvalidOperationError(op);
  switch (op[0]) {
    case '+':
      return { op: 'add', path: Pointer.from(op[1]), value: op[2] };
    case '-':
      return { op: 'remove', path: Pointer.from(op[1]) };
    case '~':
      return { op: 'replace', path: Pointer.from(op[1]), value: op[2] };
    case '>':
      return { op: 'move', from: Pointer.from(op[1]), path: Pointer.from(op[2]) };
    case '^':
      return { op: 'copy', from: Pointer.from(op[1]), path: Pointer.from(op[2]) };
    case '?':
      return { op: 'test', path: Pointer.from(op[1]), value: op[2] };
  }
}

export function serialize(patch: Patch): SerialPatch {
  if (patch instanceof Uint8Array) {
    try {
      // Validate serial patch
      deserialize(patch);
      return patch;
    } catch (e) {
      if (e instanceof ReferenceError) throw e;
      throw new UnserializableError(`Non-serializable patch: '${JSON.stringify(patch)}'`);
    }
  }
  patch = minify(patch);

  const ops: Serial.Op[] = patch.map(serializeOp);

  // Get the total length of all arrays.
  let length = 0;
  for (let i = 0; i < ops.length; i++) length += ops[i].length;

  // Create a new array with total length and merge all source arrays.
  const result = new Uint8Array(length);
  let offset = 0;
  for (let i = 0; i < ops.length; i++) {
    const x = ops[i];
    result.set(x, offset);
    offset += x.length;
  }

  return result;
}

export function serializeOp(op: Op): Serial.Op {
  const result = serializeBSON(Object.assign({}, op));

  // Check that the serialized result can be deserialized into the original patch
  // this ensures there was no non-serializable data in the patch
  try {
    if (eq(deserializeOp(result), op, {})) return result;
  } catch (e) {
    if (!(e instanceof InvalidOperationError)) throw e;
  }
  throw new UnserializableError(`Non-serializable op: '${JSON.stringify(op)}'`);
}

export function deserialize(patch: SerialPatch): MiniPatch {
  const deserializedPatch: MiniPatch = [];
  for (let i = 0; i < patch.length; ) {
    const length = getInt32LE(patch, i);
    const op = deserializeOp(patch.subarray(i, i + length));
    deserializedPatch.push(op);
    i += length;
  }

  return deserializedPatch;
}

function deserializeOp(op: Serial.Op): Mini.Op {
  const obj = deserializeBSON(op);
  const arr = [];
  for (const k in obj) arr[Number(k)] = obj[k];
  if (!isMinified(arr as never)) throw new InvalidOperationError(arr as never);
  return minifyOp(arr as never);
}

function isPointerable(x: unknown): x is typeof Pointer | string {
  if (x === null || x === undefined) return false;
  if (typeof x === 'string') return true;
  if (x instanceof Pointer) return true;
  if (x instanceof Uint8Array) return true;
  if (typeof x === 'object') {
    if ('buffer' in x && x['buffer'] instanceof Uint8Array) return true;
    else if ('tokens' in x && Array.isArray(x['tokens'])) return true;
  }
  return false;
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
