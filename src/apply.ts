import { TestError } from './error';
import { Mini, minify, Patch } from './patch';
import { Pointer } from './pointer';
import { clone, eq } from './utils';

export function apply<DocType>(patch: Patch, a: DocType) {
  // Create a deep copy of the object
  let b: unknown = clone(a);

  if (!patch) return b;

  for (const op of minify(patch)) {
    switch (op[0]) {
      case '+':
        b = add(b, op);
        break;
      case '-':
        b = remove(b, op);
        break;
      case '~':
        b = replace(b, op);
        break;
      case '>':
        b = move(b, op);
        break;
      case '^':
        b = copy(b, op);
        break;
      case '?':
        b = test(b, op);
        break;
    }
  }

  return b;
}

function add<DocType, V>(a: DocType, [, ptr, newVal]: Mini.AddOp<V>): DocType | V {
  return Pointer.from(ptr).push(a, clone(newVal));
}

function remove<DocType>(a: DocType, [, ptr]: Mini.RemoveOp): DocType | undefined {
  return Pointer.from(ptr).delete(a);
}

function replace<DocType, V>(a: DocType, [, ptr, newVal]: Mini.ReplaceOp<V>): DocType | V {
  return Pointer.from(ptr).set(a, clone(newVal));
}

function move<DocType>(a: DocType, [, from, to]: Mini.MoveOp): DocType | undefined {
  const val = Pointer.from(from).get(a);
  return Pointer.from(to).push(Pointer.from(from).delete(a), val) as DocType;
}

function copy<DocType>(a: DocType, [, from, to]: Mini.CopyOp): DocType {
  return Pointer.from(to).push(a, Pointer.from(from).get(a)) as DocType;
}

export function test<DocType>(a: DocType, [, ptr, test]: Mini.TestOp): DocType {
  const actual = Pointer.from(ptr).get(a);

  if (!eq(actual, test)) throw new TestError(actual, test);

  return a;
}
