import Typeson from 'typeson';
import structuredCloningThrowing from 'typeson-registry/dist/presets/structured-cloning-throwing';

import { Awaitable } from './common-types';
import { StorageArea, AllowedKey, Key } from './kv-storage-interface';
import { throwForDisallowedKey } from './common'
import { encodeKey, decodeKey } from './key-encoding';

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
const TSON = new Typeson().register(structuredCloningThrowing);

const setValue = async <T>(kv: KVNamespace, key: string, value: T, options: KVPutOptions, packer: KVPacker) =>
  kv.put(key, await packer.pack(TSON.encapsulate(value)), options);

const getValue = async (kv: KVNamespace, key: string, packer: KVPacker) =>
  TSON.revive(await packer.unpack(kv, key));

/**
 * An implementation of the `StorageArea` interface wrapping Cloudflare Worker's KV store.
 * 
 * The goal of this class is ease of use and compatibility with other Storage Area implementations, 
 * such as <https://github.com/GoogleChromeLabs/kv-storage-polyfill>.
 * 
 * While work on [the specification](https://wicg.github.io/kv-storage/) itself has stopped, 
 * it's still a good interface for asynchronous data access that feels native to JavaScript.
 * 
 * Note that efficiency is not a goal. Specifically, if you have sizable `ArrayBuffer`s,
 * it's much better to use Cloudflare's KV directly.
 */
export class KVStorageArea implements StorageArea<KVNamespace> {
  #kv: KVNamespace;
  #packer: KVPacker;

  constructor(name: string | KVNamespace, { packer = new JSONPacker() }: KVOptions = {}) {
    this.#kv = (typeof name === 'string')
      ? Reflect.get(self, name)
      : name;
    if (!this.#kv) throw Error('KV binding missing. Consult CF Workers documentation for details')
    this.#packer = packer;
  }

  async get<T>(key: AllowedKey): Promise<T> {
    throwForDisallowedKey(key);
    return getValue(this.#kv, encodeKey(key), this.#packer);
  }

  async set<T>(key: AllowedKey, value: T | undefined, options?: KVPutOptions): Promise<void> {
    if (value === undefined) await this.#kv.delete(encodeKey(key));
    else {
      throwForDisallowedKey(key);
      await setValue(this.#kv, encodeKey(key), value, options, this.#packer);
    }
  }

  async delete(key: AllowedKey) {
    throwForDisallowedKey(key);
    return this.#kv.delete(encodeKey(key));
  }

  async clear(opts?: KVListOptions) {
    for await (const key of paginationHelper(this.#kv, opts)) {
      await this.#kv.delete(key)
    }
  }

  async *keys(opts?: KVListOptions): AsyncGenerator<Key> {
    for await (const key of paginationHelper(this.#kv, opts)) {
      yield decodeKey(key);
    }
  }

  async *values<T>(opts?: KVListOptions): AsyncGenerator<T> {
    for await (const key of paginationHelper(this.#kv, opts)) {
      yield getValue(this.#kv, key, this.#packer);
    }
  }

  async *entries<T>(opts?: KVListOptions): AsyncGenerator<[Key, T]> {
    for await (const key of paginationHelper(this.#kv, opts)) {
      yield [decodeKey(key), await getValue(this.#kv, key, this.#packer)];
    }
  }

  backingStore() {
    return this.#kv;
  }
}

export interface KVPacker {
  pack(typeson: any): Awaitable<string | ArrayBuffer | ReadableStream<Uint8Array>>;
  unpack(kv: KVNamespace, key: string): Promise<any>;
}

export class JSONPacker implements KVPacker {
  pack(typeson: any) { return JSON.stringify(typeson) }
  async unpack(kv: KVNamespace, key: string) { return await kv.get(key, 'json') }
}

export interface KVOptions {
  packer?: KVPacker
}

export interface KVPutOptions {
  expiration?: string | number;
  expirationTtl?: string | number;
}

export interface KVListOptions {
  prefix?: string
}

/**
 * Abstracts Cloudflare KV's cursor-based pagination with async iteration.
 */
async function* paginationHelper(kv: KVNamespace, opts: KVListOptions = {}) {
  let keys: { name: string; expiration?: number; metadata?: unknown }[];
  let done: boolean;
  let cursor: string;
  do {
    ({ keys, list_complete: done, cursor } = await kv.list({ ...cursor ? { ...opts, cursor } : opts }));
    for (const { name } of keys) yield name;
  } while (!done);
}

export * from './kv-storage-interface';
