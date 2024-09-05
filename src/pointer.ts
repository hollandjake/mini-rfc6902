import { MissingError } from './error';

type Token = string | number;

export class Pointer {
  readonly leafToken: Token | undefined;

  constructor(readonly tokens: Token[]) {
    this.leafToken = tokens[tokens.length - 1];
  }

  public static from(str: Pointer | string) {
    if (str instanceof Pointer) return str;

    const [, ...tokens] = str.split('/');
    return new Pointer(tokens.map(unescape));
  }

  delete<T>(a: T): T | undefined {
    // The target is the root, so deleting it would result in a becoming undefined
    if (this === RootPointer) return undefined;

    const [obj, key] = this.evaluatePointer(a);
    if (obj === null) throw new MissingError(this);

    if (Array.isArray(obj)) {
      // ptr must be an array index
      if (key === '-') {
        obj.pop();
      } else {
        obj.splice(Number(key), 1);
      }
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
      value = parent?.[key as never] ?? undefined;
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
    return `'${this.toString()}'`;
  }

  push<T, V>(a: T, newVal: V): T | V {
    const [obj, key] = this.evaluatePointer(a);

    if (this === RootPointer && key === undefined) {
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
    if (this === RootPointer) return value;

    const [obj, key] = this.evaluatePointer(a);

    if (key !== undefined) {
      obj![key as never] = value as never;
    }

    return a;
  }

  public toBSON() {
    return this.tokens.reduce((a, v, k) => ({ ...a, [`${k}`]: v }), {});
  }

  public toJSON() {
    return this.tokens;
  }

  /**
   * https://datatracker.ietf.org/doc/html/rfc6901#section-5
   */
  public toString() {
    return this.tokens.length ? `/${this.tokens.map(escape).join('/')}` : '';
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
  return token.replace(/~/g, '~0').replace(/\//g, '~1');
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
