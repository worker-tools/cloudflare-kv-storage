import { Base64Decoder, Base64Encoder } from 'base64-encoding';
import { AllowedKey, RoundTripKey } from './interface';

// TODO: Move to separate repository?

/**
 * A simple string serialization for IndexedDB-like keys.
 * 
 * Since Cloudflare's KV storage only allows string keys, but KV Storage allows complex (composed) IndexedDB-like keys,
 * a format is needed to convert between the two.
 * 
 * The goal of this format is human readability, minimal tagging, and leaving regular strings unmodified,
 * so that the most likely usage scenario carries no extra weight.
 * For tagging other types, 2 extra characters are used. This is the smallest sensible choice I could think of. 
 * Perhaps there's cleverer ways than prefixing, but hopefully not a simpler way.
 * 
 * Below are some notable examples:
 * 
 * ```
 * 'some key'        => 'some key' // (no extra quotes)
 * Number(300)       => 'n:300'
 * new Date(0)       => 'd:1970-01-01T00:00:00.000Z'
 * ['foo', 'bar]     => '<foo|bar>'
 * ['foo', [1, 2]]   => '<foo|<n:1|n:2>>'
 * 'with|re<served>' => 's:with%7Cre%5Bserved%5D' // URL encoding iff necessary
 * 'e:vil'           => 's:e%3vil'
 * ```
 * The last two examples show how strings containing array delimiters 
 * or conforming to the 2-char tagging schema will be processed.
 * 
 * While mostly arbitrary, pointy brackets and pipes (`<`, `>`, `|`) were chosen as delimiters because 
 * 1. they're part of ASCII (occupy single byte),
 * 2. less likely to be found in english text than parens and commas, and
 * 3. not part of stringified JSON (common practice despite being bad-practice!?)
 * 
 * Encoding and then decoding a key will process it according to KV Storage working draft:
 * <https://wicg.github.io/kv-storage/#key-round-trip>
 * 
 * @param key A IndexedDB-like key
 * @returns A string representing the key
 */
export const encodeKey = (key: AllowedKey): string => keyToKeyString(valueToKey(key));

/**
 * Performs the opposite of `encodeKey` with the expected limitations of
 * [key round-tripping](https://wicg.github.io/kv-storage/#key-round-trip).
 * @param key A string that represents a IndexedDB-like key encoded with `encodeKey`.
 * @returns The round-tripped value of the corresponding key.
 */
export const decodeKey = (key: string): RoundTripKey => keyStringToKey(key);

/** Matches any tagged data type (number, date, buffer, string-with-reserved chars) */
const TYPED_REP = /^(\w):/;

/** Matches any string containing reserved chars */
const ARRAY_DELIMITERS = /[\<\|\>]/;

/**
 * Performs the stringification of a key that _has already been processed according to IndexedDB's 
 * [convert a value to a key](https://w3c.github.io/IndexedDB/#convert-a-value-to-a-key) algorithm_.
 */
const keyToKeyString = (key: AllowedKey): string => {
  if (typeof key === 'string') {
    return key === '' || key.match(TYPED_REP) || key.match(ARRAY_DELIMITERS)
      ? `s:${encodeURIComponent(key)}`
      : key
  }
  if (typeof key === 'number') {
    return `n:${key}`;
  }
  if (key instanceof Date) {
    return `d:${key.toISOString()}`;
  }
  if (key instanceof ArrayBuffer) {
    return `b:${new Base64Encoder().encode(key)}`
  }
  if (Array.isArray(key)) {
    return '<' + key.map(keyToKeyString).join('|') + '>';
  }

  throw Error('Key not allowed')
}

/**
 * Performs de-stringification/parsing of a key. 
 * Uses a simple stack mechanism to match nested parens.
 */
const keyStringToKey = (key: string): RoundTripKey => {
  const re = new RegExp(ARRAY_DELIMITERS, 'g');

  let match = re.exec(key);
  if (!match) {
    return partToKey(key);
  }

  const stack: any[] = [];
  let prev = 0;
  do {
    const char = match[0];
    const index = match.index;
    if (char === '<') {
      stack.unshift([]);
    }
    if (char === '|' || char === '>') {
      if (prev !== index) {
        stack[0].push(partToKey(key.substring(prev, index)));
      }
    }
    if (char === '>') {
      const res = stack.shift();
      if (stack.length) stack[0].push(res);
      else return res;
    }
    prev = index + 1;
  } while (match = re.exec(key));

  throw Error('Malformed key')
}


/** Takes a single key string, strips the tag (if any), and converts it to its corresponding JS type */
const partToKey = (part: string): string | number | Date | ArrayBuffer => {
  const m = part.match(TYPED_REP);
  if (m) {
    const data = part.substring(2);
    switch (m[1]) {
      case 'n': return Number(data);
      case 'd': return new Date(data);
      case 'b': return new Base64Decoder().decode(data).buffer;
      case 's': return decodeURIComponent(data);
    }
  }
  return part;
}

/**
 * A pure JS implementation of IndexedDB's 
 * [convert a value to a key](https://w3c.github.io/IndexedDB/#convert-a-value-to-a-key)
 * routine.
 * 
 * Copyright 2017 Jeremy Scheff
 * Licensed under MIT
 * <https://github.com/dumbmatter/fakeIndexedDB>
 */
const valueToKey = (input: AllowedKey, seen: Set<object> = new Set()): AllowedKey => {
  if (typeof input === "number") {
    if (isNaN(input)) {
      throw new Error();
    }
    return input;
  } else if (input instanceof Date) {
    const ms = input.valueOf();
    if (isNaN(ms)) {
      throw new Error();
    }
    return new Date(ms);
  } else if (typeof input === "string") {
    return input;
  } else if (
    input instanceof ArrayBuffer ||
    (typeof ArrayBuffer !== "undefined" &&
      ArrayBuffer.isView &&
      ArrayBuffer.isView(input))
  ) {
    if (input instanceof ArrayBuffer) {
      return input;
    }
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength).slice().buffer;
  } else if (Array.isArray(input)) {
    if (seen.has(input)) {
      throw new Error();
    }
    seen.add(input);

    const keys = [];
    for (let i = 0; i < input.length; i++) {
      const hop = input.hasOwnProperty(i);
      if (!hop) {
        throw new Error();
      }
      const entry = input[i];
      const key = valueToKey(entry, seen);
      keys.push(key);
    }
    return keys;
  } else {
    throw new Error();
  }
};
