import { MissingError, PointerError } from './error';

type Token = string | number | { toString: () => string };

export class Pointer {
  constructor(readonly tokens: Token[]) {}

  public static from(str: Pointer | string | Uint8Array | ArrayBuffer) {
    if (str instanceof Pointer) return str;

    if (typeof str === 'object' && 'buffer' in str && str['buffer'] instanceof Uint8Array) str = str.buffer;
    if (str instanceof Uint8Array || str instanceof ArrayBuffer) str = new TextDecoder().decode(str);

    if (typeof str !== 'string') throw new PointerError(`Invalid pointer '${str}'`);

    const [, ...tokens] = str.split('/');
    return new Pointer(tokens.map(unescape));
  }

  delete<T>(a: T): T | undefined {
    // The target is the root, so deleting it would result in a becoming undefined
    if (RootPointer.asymmetricMatch(this)) return undefined;

    const [obj, key] = this.evaluatePointer(a);
    if (obj === null) throw new MissingError(this);

    if (Array.isArray(obj)) {
      // ptr must be an array index
      if (key === '-') {
        obj.pop();
      } else {
        obj.splice(Number(key), 1);
      }
    } else if (obj instanceof Map) {
      obj.delete(key);
    } else if (key !== undefined) {
      delete obj![key as never];
    }

    return a;
  }

  evaluatePointer<T>(a: unknown): [parent: NonNullable<T> | null, key: Token | undefined, value: unknown] {
    let parent = null;
    let key: Token | undefined = undefined;
    let value = a;

    for (let i = 0; i < this.tokens.length; i++) {
      parent = value;
      key = this.tokens[i];
      if (key === '-') {
        if (!parent) value = undefined;
        else if (Array.isArray(parent)) value = parent[parent.length - 1];
        else throw new PointerError(`Invalid key '-' for ${parent}`);
      } else {
        value = parent?.[key as never] ?? undefined;
      }
    }

    return [parent as never, key, value];
  }

  extend(token?: Token) {
    if (token === -1) token = '-';
    return new Pointer(token !== undefined ? [...this.tokens, token] : this.tokens);
  }

  get<T>(a: T) {
    const [, , value] = this.evaluatePointer(a);
    return value;
  }

  public inspect() {
    return `Pointer '${this.toString()}'`;
  }

  push<T, V>(a: T, newVal: V): T | V {
    const [obj, key] = this.evaluatePointer(a);

    if (RootPointer.asymmetricMatch(this) && key === undefined) {
      // The parent itself does not exist so we set the parent equal to the value
      return newVal;
    }

    if (Array.isArray(obj)) {
      // ptr must be an array index
      if (key === '-') {
        obj.push(newVal);
      } else {
        obj.splice(Number(key), 0, newVal);
      }
    } else if (key !== undefined) {
      obj![key as never] = newVal as never;
    }

    return a;
  }

  set<T, V>(a: T, value: V): T | V {
    if (RootPointer.asymmetricMatch(this)) return value;

    const [obj, key] = this.evaluatePointer(a);

    if (key !== undefined) {
      if (obj instanceof Map) {
        obj.set(key, value);
      } else {
        obj![key as never] = value as never;
      }
    }

    return a;
  }

  /**
   * Convert pointers to string for easy BSONification
   */
  public toBSON(): string {
    return this.toString();
  }

  public toJSON() {
    return this.toString();
  }

  /**
   * https://datatracker.ietf.org/doc/html/rfc6901#section-5
   */
  public toString() {
    return this.tokens.length ? `/${this.tokens.map(escape).join('/')}` : '';
  }

  public asymmetricMatch(other: unknown) {
    const o = Pointer.from(other as never);
    return this.tokens.length === o.tokens.length && this.tokens.every((t, i) => o.tokens[i] === String(t));
  }
}

export const RootPointer = new Pointer([]);

/**
 * Escape token to ensure valid JSON Pointer string
 *
 * > Because the characters '~' (%x7E) and '/' (%x2F) have special
 * > meanings in JSON Pointer, '~' needs to be encoded as '~0' and '/'
 * > needs to be encoded as '~1' when these characters appear in a
 * > reference token.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6901#section-3
 *
 * @param token - The token to escape
 */
function escape(token: Token): string {
  if (typeof token === 'number') token = `${token}`;
  return token.toString().replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Unescape token to retrieve JSON Pointer token
 *
 * > Because the characters '~' (%x7E) and '/' (%x2F) have special
 * > meanings in JSON Pointer, '~' needs to be encoded as '~0' and '/'
 * > needs to be encoded as '~1' when these characters appear in a
 * > reference token.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6901#section-3
 *
 * @param token - The escaped token to unescape
 */
function unescape(token: string): Token {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}
