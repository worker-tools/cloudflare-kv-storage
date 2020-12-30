export type Key = string | number | Date | BufferSource | Key[];

declare var StorageArea: {
    prototype: StorageArea;
    new(name: string): StorageArea;
};

type Options = Record<string, any>;

/**
 * Main differences to the working draft:
 * - Type parameter for backing store.
 * - Added unspecified options paramter to all methods. 
 *   This way users can provide extra data to the underlying implementation without type casting.
 */
export interface StorageArea<BS = any> {
  set<T>(key: Key, value: T, opts?: Options): Promise<void> ;
  get<T>(key: Key, opts?: Options): Promise<T> ;
  delete(key: Key, opts?: Options): Promise<void> ;
  clear(opts?: Options): Promise<void> ;

  keys(opts?: Options): AsyncIterableIterator<Key>;
  values<T>(opts?: Options): AsyncIterableIterator<T>;
  entries<T>(opts?: Options): AsyncIterableIterator<[Key, T]>;

  backingStore(): BS;
};
