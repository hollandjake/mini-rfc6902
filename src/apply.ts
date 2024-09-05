import { TestError } from './error';
import { Mini, minify, Patch } from './patch';
import { Pointer } from './pointer';
import { clone, eq, Opts } from './utils';

export function apply<DocType>(target: DocType, patch: Patch, opts: Opts = {}) {
  // Create a deep copy of the object
  let b: unknown = clone(target, opts);

  if (!patch) return b;

  for (const op of minify(patch)) {
    switch (op[0]) {
      case '+':
        b = add(b, op, opts);
        break;
      case '-':
        b = remove(b, op);
        break;
      case '~':
        b = replace(b, op, opts);
        break;
      case '>':
        b = move(b, op, opts);
        break;
      case '^':
        b = copy(b, op, opts);
        break;
      case '?':
        b = test(b, op, opts);
        break;
    }
  }

  return b;
}

function add<DocType, V>(target: DocType, [, ptr, newVal]: Mini.AddOp<V>, opts: Opts = {}): DocType | V {
  return Pointer.from(ptr).push(target, clone(newVal, opts));
}

function remove<DocType>(target: DocType, [, ptr]: Mini.RemoveOp): DocType | undefined {
  return Pointer.from(ptr).delete(target);
}

function replace<DocType, V>(target: DocType, [, ptr, newVal]: Mini.ReplaceOp<V>, opts: Opts = {}): DocType | V {
  return Pointer.from(ptr).set(target, clone(newVal, opts));
}

function move<DocType>(target: DocType, [, from, path]: Mini.MoveOp, opts: Opts = {}): DocType | undefined {
  const val = Pointer.from(from).get(target);
  return Pointer.from(path).push(Pointer.from(from).delete(target), clone(val, opts)) as DocType;
}

function copy<DocType>(target: DocType, [, from, path]: Mini.CopyOp, opts: Opts = {}): DocType {
  return Pointer.from(path).push(target, clone(Pointer.from(from).get(target), opts)) as DocType;
}

export function test<DocType>(target: DocType, [, ptr, test]: Mini.TestOp, opts: Opts = {}): DocType {
  const actual = Pointer.from(ptr).get(target);

  if (!eq(actual, test, opts)) throw new TestError(actual, test);

  return target;
}
