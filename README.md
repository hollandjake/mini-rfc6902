# mini-rfc6902

[![npm package](https://img.shields.io/npm/v/mini-rfc6902.svg)](https://www.npmjs.com/package/mini-rfc6902)
[![documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg) ](https://github.com/hollandjake/mini-rfc6902/blob/main/README.md)
[![licence](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/hollandjake/mini-rfc6902/blob/main/LICENSE)

Complete TypeScript implementation of [RFC6902](https://datatracker.ietf.org/doc/html/rfc6902) "JavaScript Object
Notation (JSON) Patch"
(including [RFC6901](https://datatracker.ietf.org/doc/html/rfc6901) "JavaScript Object Notation (JSON) Pointer"),
for creating and consuming `application/json-patch+json` documents
With optional custom minified format support for reducing bandwidth.

Also offers "diff" functionality to create patches without `Object.observe`

## 🛠 Installation

```sh
npm install mini-rfc6902
```

### Import into your script

```ts
const { create, apply } = require('mini-rfc6902');
```

or

```ts
import { create, apply } from "mini-rfc6902";
```

### Calculate diff between two objects

```ts
create({ first: 'Jake' }, { first: 'Jake', last: 'Holland' });
// [{ op: 'add', path: '/last', value: 'Holland' }]
```

### Apply a patch

```ts
const obj = { first: 'Jake' }
const patch = [{ op: 'add', path: '/last', value: 'Holland' }];
apply(patch, obj)
// { first: 'Jake', last: 'Holland' }
```

## 🔬 How it works

### `create(a: any, b: any, minify?: true): Patch`

Returns a list of operations (a JSON Patch) comprised of the operations to transform `a` into `b`.
It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
as a full replacement may result in more bytes being sent.

For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.

Equality checks are performed using bson serialization with serializeFunctions enabled.
This allows very quick comparisons of raw Buffers with support for all primitives (except symbols)

### `apply(patch: Patch, target: any): any`

Takes a given patch and applies the operations to a deep copy of the target, 
it returns the final modified outcome of all the patches.

If any of the operations fail, an error is thrown with details as to what happened.

## 🏠 Homepage

You can find more about this on [GitHub](https://github.com/hollandjake/mini-rfc6902).

## 🖋️ Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/hollandjake/mini-rfc6902/issues).

## 🤝 Show your support

Give a ⭐ if this package helped you!

## 📜 License

This project is [MIT](https://github.com/hollandjake/mini-rfc6902/blob/main/LICENSE) licensed.
