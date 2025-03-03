[![npm package](https://img.shields.io/npm/v/mini-rfc6902.svg)](https://www.npmjs.com/package/mini-rfc6902)
[![documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg) ](https://github.com/hollandjake/mini-rfc6902/blob/main/README.md)
[![licence](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/hollandjake/mini-rfc6902/blob/main/LICENSE)

# mini-rfc6902

> Complete TypeScript implementation of [RFC6902](https://datatracker.ietf.org/doc/html/rfc6902) "JavaScript Object
> Notation (JSON) Patch"
> (including [RFC6901](https://datatracker.ietf.org/doc/html/rfc6901) "JavaScript Object Notation (JSON) Pointer"),
> for creating and consuming `application/json-patch+json` documents
> with custom minified format support for reducing bandwidth,
> with optional support for using the original verbose syntax.
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
import { create, apply } from 'mini-rfc6902';
```

or in browser

```html
<script src="https://unpkg.com/mini-rfc6902"></script>

<script>
  const { create, apply } = rfc6902;
</script>
```

## Usage

### Calculate diff between two objects

```ts
create({ first: 'Jake' }, { first: 'Jake', last: 'Holland' });
// [['+', '/last', 'Holland']]
```

### Apply a patch

```ts
const obj = { first: 'Jake' };
const patch = [['+', '/last', 'Holland']];
apply(obj, patch);
// { first: 'Jake', last: 'Holland' }
```

## API

### `create(input: any, output: any, opts?: CreateOpts): Patch`

<details>
<summary>Optional <code>CreateOpts</code> argument</summary>

#### `opts.eq(x: Exclude<any, null | undefined>, y: Exclude<any, null | undefined>, opts: {skip: () => void}): boolean`

User defined equality function, this is called whenever we are comparing two values for equality,
if two values are deemed equal we do not traverse deeper inside of it to check for differences

calling the `opts.skip()` method from within this definition will allow the default equality handlers to run

#### `opts.clone<T>(val: T, opts: {skip: () => void)}): T`

User defined clone function, this is called whenever we are returning a value from the input back in a patch,
to ensure mutations don't occur.

calling the `opts.skip()` method from within this definition will allow the default clone handlers to run

####

`opts.diff(input: Exclude<any, null | undefined>, output: Exclude<any, null | undefined>, ptr: Pointer, opts: {skip: () => void}): Patch`

User defined diff creation function, this is called whenever we hit a point to compute the difference between two values

calling the `opts.skip()` method from within this definition will allow the default diff handlers to run

#### `opts.transform`

Configure whether to transform the output patch into `minify`, `maximize` or `serialize`, by default all inbuilt operations
return minified patches, but user defined diffs may not.

If the user wishes to use `serialize`, the optional `bson` dependency is required for both serialize and deserialize

</details>

Returns a list of operations (a JSON Patch) comprised of the operations to transform `input` into `output`.
It attempts to produce the smallest patch, this does not necessarily mean the smallest number of operations,
as a full replacement may result in more bytes being sent.

For array transformations we attempt to reduce the size of operations by running an edit distance style algorithm,
with support for `add`, `remove`, `replace`, `copy`, `array replace` operations.

### `apply(target: any, patch: Patch, opts?: ApplyOpts): any`

<details>
<summary>Optional <code>ApplyOpts</code> argument</summary>

#### `opts.eq(x: Exclude<any, null | undefined>, y: Exclude<any, null | undefined>, opts: {skip: () => void}): boolean`

User defined equality function, this is called whenever we are comparing two values for equality,
if two values are deemed equal we do not traverse deeper inside of it to check for differences

calling the `opts.skip()` method from within this definition will allow the default equality handlers to run

#### `opts.clone<T>(val: T, opts: {skip: () => void)}): T`

User defined clone function, this is called whenever we are returning a value from the input back in a patch,
to ensure mutations don't occur.

calling the `opts.skip()` method from within this definition will allow the default clone handlers to run

#### `opts.transform`

Configure whether to transform the output patch into `minify`, `maximize` or `serialize`, by default all inbuilt operations
return minified patches, but user defined diffs may not.

If the user wishes to use `serialize`, the optional `bson` dependency is required for both serialize and deserialize

</details>

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

- **[Jake Holland](https://github.com/hollandjake)**

See also the list of [contributors](https://github.com/hollandjake/mini-rfc6902/contributors) who participated in this
project.

## License

This project is [MIT](https://github.com/hollandjake/mini-rfc6902/blob/main/LICENSE) licensed.
