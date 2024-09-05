[![npm package](https://img.shields.io/npm/v/mini-rfc6902.svg)](https://www.npmjs.com/package/mini-rfc6902)
[![documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg) ](https://github.com/hollandjake/mini-rfc6902/blob/main/README.md)
[![licence](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/hollandjake/mini-rfc6902/blob/main/LICENSE)

# mini-rfc6902

> Complete TypeScript implementation of [RFC6902](https://datatracker.ietf.org/doc/html/rfc6902) "JavaScript Object
> Notation (JSON) Patch"
> (including [RFC6901](https://datatracker.ietf.org/doc/html/rfc6901) "JavaScript Object Notation (JSON) Pointer"),
> for creating and consuming `application/json-patch+json` documents
> with optional custom minified format support for reducing bandwidth.
> 
> Also offers "diff" functionality to create patches without `Object.observe`

## Installation

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

## Usage

### Calculate diff between two objects

```ts
create({ first: 'Jake' }, { first: 'Jake', last: 'Holland' });
// [{ op: 'add', path: '/last', value: 'Holland' }]
```

### Apply a patch

```ts
const obj = { first: 'Jake' }
const patch = [{ op: 'add', path: '/last', value: 'Holland' }];
apply(obj, patch)
// { first: 'Jake', last: 'Holland' }
```

## API

### `create(input: any, output: any, minify?: true): Patch`

Returns a list of operations (a JSON Patch) comprised of the operations to transform `input` into `output`. 
It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
as a full replacement may result in more bytes being sent.

For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.

Equality checks are performed using nodes util `isDeepStrictEqual` for maximum performance

### `apply(target: any, patch: Patch): any`

Takes a given patch and applies the operations to a deep copy of the target, 
it returns the final modified outcome of all the patches.

If any of the operations fail, an error is thrown with details as to what happened.

## Homepage

You can find more about this on [GitHub](https://github.com/hollandjake/mini-rfc6902).

## Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/hollandjake/mini-rfc6902/issues).

## Credits

Thanks to [rfc6902](https://github.com/chbrown/rfc6902) for the inspiration

## Authors

* **[Jake Holland](https://github.com/hollandjake)**

See also the list of [contributors](https://github.com/hollandjake/mini-rfc6902/contributors) who participated in this project.

## License

This project is [MIT](https://github.com/hollandjake/mini-rfc6902/blob/main/LICENSE) licensed.
