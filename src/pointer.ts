import { MissingError, PointerError } from './error';

type Token = string | number | { toString: () => string };

/**
 * RFC-6901 complaint pointer
 *
 * Identifies a specific value within a JavaScript Object Notation (JSON) document.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6901
 */
export class Pointer {
  constructor(readonly tokens: Token[]) {}

  public static from(str: Pointer | string | Uint8Array | ArrayBuffer) {
    if (str instanceof Pointer) return str;
    if (str) {
      if (typeof str === 'object') {
        if ('buffer' in str && str.buffer instanceof Uint8Array) str = str.buffer;
        else if ('tokens' in str && Array.isArray(str.tokens)) return new Pointer(str.tokens);
      }
      if (str instanceof Uint8Array || str instanceof ArrayBuffer) str = new TextDecoder().decode(str);
    }
    if (typeof str !== 'string') throw new PointerError(`Invalid pointer '${str}'`);

    const [, ...tokens] = str.split('/');
    return new Pointer(tokens.map(tokenUnescape));
  }

  delete<T>(a: T): T | undefined {
    // The target is the root, so deleting it would result in a becoming undefined
    if (RootPointer.asymmetricMatch(this)) return undefined;

    const [obj, key] = this.evaluatePointer(a, true);

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
      delete obj?.[key as never];
    }

    return a;
  }

  evaluatePointer<T>(
    a: unknown,
    existCheck?: boolean,
  ): [parent: NonNullable<T> | null, key: Token | undefined, value: unknown] {
    let parent = null;
    let key: Token | undefined;
    let value = a;

    for (let i = 0; i < this.tokens.length; i++) {
      parent = value;
      if (!parent) {
        if (existCheck) throw new MissingError(this);
        value = undefined;
        break;
      }

      if (typeof parent !== 'object') throw new PointerError(`Invalid key '${key}' for ${parent}`);

      key = this.tokens[i];
      if (key === '-') {
        if (Array.isArray(parent)) key = parent.length;
        else throw new PointerError(`Invalid key '-' for ${parent}`);
      }

      if (Array.isArray(parent)) {
        const arrayKey = Number(key);
        if (Number.isNaN(arrayKey)) throw new PointerError(`Invalid key '${key}' for ${parent}`);
        if (existCheck && (arrayKey < 0 || arrayKey >= parent.length)) throw new MissingError(this);
        value = parent[arrayKey];
      } else {
        if (parent instanceof Map) {
          if (existCheck && !parent.has(key)) throw new MissingError(this);
          value = parent.get(key);
        } else {
          let resolvedKey: string | number = key as never;
          if (typeof key === 'object' && 'toString' in key) resolvedKey = key.toString();
          if (existCheck && !(resolvedKey in parent)) throw new MissingError(this);
          value = parent[resolvedKey as never];
        }
      }
    }

    return [parent as never, key, value];
  }

  extend(token?: Token) {
    if (token === -1) token = '-';
    return new Pointer(token !== undefined ? [...this.tokens, token] : this.tokens);
  }

  get<T>(a: T) {
    const [, , value] = this.evaluatePointer(a, true);
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
      // biome-ignore lint/style/noNonNullAssertion: We expect it to error here
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
        // biome-ignore lint/style/noNonNullAssertion: We expect it to error here
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
    return this.tokens.length ? `/${this.tokens.map(tokenEscape).join('/')}` : '';
  }

  public asymmetricMatch(other: unknown) {
    const o = Pointer.from(other as never);
    return this.tokens.length === o.tokens.length && this.tokens.every((t, i) => String(o.tokens[i]) === String(t));
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
function tokenEscape(token: Token): string {
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
function tokenUnescape(token: string): Token {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}
