import { Base64Decoder, Base64Encoder } from 'base64-encoding';
import { Key } from './storage-area-types';

/**
 * A simple string serialization for IndexedDB-like keys.
 * 
 * Since Cloudflare's KV storage only allows string keys, but KV Storage allows complex (composed) IndexedDB-like keys,
 * a format is needed to convert between the two.
 * 
 * The goal of this format is human readability, minimal tagging, and leaving regular strings unmodified so that the most likely usage scenario carries no extra weight.
 * For tagging other types using 2 extra characters is the smallest sensible choice I could think of. 
 * Perhaps there's cleverer ways than prefixing, but hopefully not a simpler way.
 * 
 * I couldn't find a format that could do this (without wrapping strings in double quotes like JSON) so I've created this format and parser.
 * Joke's on me if something like this already exists...
 * 
 * Below are some notable examples:
 * 
 * ```
 * 'some key'        => 'some key' // (no extra quotes)
 * Number(300)       => 'n:300'
 * new Date(0)       => 'd:1970-01-01T00:00:00.000Z'
 * ['foo', 'bar', 3] => '<foo|bar|n:3>'
 * ['foo', [1, 2]]   => '<foo|<n:1|n:2>>'
 * 'with|re<served>' => 's:with%7Cre%5Bserved%5D' // URL encoding iff necessary
 * 'e:vil'           => 's:e%3vil'
 * ''                => 's:' // solves an edge case in the parser..
 * ```
 * Strings containing array delimiters or conforming to the 2-char tagging schema will be URL encoded. 
 * For the most part they should be  
 * 
 * While mostly arbitrary, pointy brackets and pipes (`<`, `>`, `|`) were chosen as delimiters because 
 * 1. they're part of ASCII (occupy single byte),
 * 2. less likely to be found in typical text than parens and commas, and
 * 3. not part of stringified JSON (common practice despite being bad-practice!?)
 * 
 * Encoding and then decoding a key will process it according to KV Storage working draft:
 * <https://wicg.github.io/kv-storage/#key-round-trip>
 * 
 * @param key A IndexedDB-like key
 * @returns A string representing the key
 */
export const encodeKey = (key: Key): string => safeKeyToCompactString(keyToSafeKey(key));

/**
 * @param key A string that represents a IndexedDB-like key.
 * @returns The round-tripped value of the corresponding key.
 */
export const decodeKey = (key: string): Key => compactStringToKey(key);

/** Matches any tagged data type (number, date, buffer, string-with-reserved chars) */
const TYPED_REP = /^(\w):/;

/** Matches any string containing reserved chars */
const ARRAY_DELIMITERS = /[\<\|\>]/;

/**
 * Performs the stringification of a key that _has already been processed according to IndexedDB's 
 * [convert a value to a key](https://w3c.github.io/IndexedDB/#convert-a-value-to-a-key) algorithm_.
 */
const safeKeyToCompactString = (key: Key): string => {
  if (Array.isArray(key)) {
    return '<' + key.map(safeKeyToCompactString).join('|') + '>';
  }
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
}

/**
 * Performs de-stringification/parsing of a key. 
 * Uses a simple stack mechanism to match nested parens.
 */
const compactStringToKey = (key: string): Key => {
  const re = new RegExp(ARRAY_DELIMITERS, 'g');

  let match = re.exec(key);
  if (!match) {
    return stringPartToKey(key);
  }

  const stack = [];
  let prev = 0;
  do {
    const char = match[0];
    const index = match.index;
    if (char === '<') {
      stack.unshift([]);
    }
    if (char === '|' || char === '>') {
      if (prev !== index) {
        stack[0].push(stringPartToKey(key.substring(prev, index)));
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


type KeyPart = string|number|Date|ArrayBuffer;

/** Takes a simple i.e. single key string, strips the tag if any, and converts it to a JS type. */
const stringPartToKey = (part: string): KeyPart => {
  const m = part.match(TYPED_REP);
  if (m) {
    const data = part.substring(2);
    switch (m[1]) {
      case 'n': return Number(data);
      case 'd': return new Date(data);
      case 'b': return new Base64Decoder().decode(data).buffer;
      case 's': return decodeURIComponent(data);
    }
  } else {
    return part;
  }
}

/**
 * Copyright 2017 Jeremy Scheff
 * Licensed under MIT
 * 
 * Implements <https://w3c.github.io/IndexedDB/#convert-a-value-to-a-key>
 */
const keyToSafeKey = (input: Key, seen: Set<object> = new Set()): Key => {
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
      return new Uint8Array(input).buffer;
    }
    return new Uint8Array(input.buffer).buffer;
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
      const key = keyToSafeKey(entry, seen);
      keys.push(key);
    }
    return keys;
  } else {
    throw new Error();
  }
};

/**
 * 
 * Copyright 2019 Google Inc.
 * Licensed under Apache-2.0.
 * <https://github.com/GoogleChromeLabs/kv-storage-polyfill>
 */
export function throwForDisallowedKey(key: any) {
  if (!isAllowedAsAKey(key)) {
    throw Error('kv-storage: The given value is not allowed as a key: ' + key);
  }
}

function isAllowedAsAKey(value: any) {
  if (typeof value === 'number' || typeof value === 'string') {
    return true;
  }

  if (typeof value === 'object' && value) {
    if (Array.isArray(value)) {
      return true;
    }

    if (value instanceof Date) {
      return true;
    }

    if (ArrayBuffer.isView(value)) {
      return true;
    }

    if (value instanceof ArrayBuffer) {
      return true;
    }
  }

  return false;
}