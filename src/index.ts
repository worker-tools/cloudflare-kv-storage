import { StorageArea, AllowedKey, RoundTripKey } from './interface';
import { throwForDisallowedKey } from './common'
import { encodeKey, decodeKey } from './key-encoding';
import { KVPacker, TypesonPacker } from './packer';

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
export class CloudflareStorageArea implements StorageArea<KVNamespace> {
  #kv: KVNamespace;
  #packer: KVPacker;

  constructor(name: string | KVNamespace, { packer = new TypesonPacker() }: KVOptions = {}) {
    this.#kv = (typeof name === 'string')
      ? Reflect.get(self, name)
      : name;
    if (!this.#kv) throw Error('KV binding missing. Consult Workers documentation for details')
    this.#packer = packer;
  }

  async get<T>(key: AllowedKey, opts?: unknown): Promise<T> {
    throwForDisallowedKey(key);
    return this.#packer.get(this.#kv, encodeKey(key), opts);
  }

  async set<T>(key: AllowedKey, value: T | undefined, opts?: KVPutOptions): Promise<void> {
    throwForDisallowedKey(key);
    if (value === undefined) 
      await this.#kv.delete(encodeKey(key));
    else {
      await this.#packer.set(this.#kv, encodeKey(key), value, opts);
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

  async *keys(opts?: KVListOptions): AsyncGenerator<RoundTripKey> {
    for await (const key of paginationHelper(this.#kv, opts)) {
      yield decodeKey(key);
    }
  }

  async *values<T>(opts?: KVListOptions): AsyncGenerator<T> {
    for await (const key of paginationHelper(this.#kv, opts)) {
      yield this.#packer.get(this.#kv, key, opts);
    }
  }

  async *entries<T>(opts?: KVListOptions): AsyncGenerator<[RoundTripKey, T]> {
    for await (const key of paginationHelper(this.#kv, opts)) {
      yield [decodeKey(key), await this.#packer.get(this.#kv, key, opts)];
    }
  }

  backingStore() {
    return this.#kv;
  }
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

/** Abstracts Cloudflare KV's cursor-based pagination with async iteration. */
async function* paginationHelper(kv: KVNamespace, opts: KVListOptions = {}) {
  let keys: { name: string; expiration?: number; metadata?: unknown }[];
  let done: boolean;
  let cursor: string;
  do {
    ({ keys, list_complete: done, cursor } = await kv.list({ ...cursor ? { ...opts, cursor } : opts }));
    for (const { name } of keys) yield name;
  } while (!done);
}

/** @deprecated for backwards compat with v0.2.0 */
export class KVStorageArea extends CloudflareStorageArea {};
export { CloudflareStorageArea as CFStorageArea }; // for ease of use
export * from './interface';
