export type AllowedKey = string | number | Date | BufferSource | AllowedKey[];
export type Key = string | number | Date | ArrayBuffer | Key[];

type Options = Record<string, any>;

// TODO: move to separate repository

declare var StorageArea: {
  prototype: StorageArea;
  new(name: string, opts?: Options): StorageArea;
};

/**
 * Main differences to the working draft:
 * - Type parameter for backing store.
 * - Added unspecified options paramter to all methods. 
 *   This way users can provide extra data to the underlying implementation without type casting.
 */
export interface StorageArea<BS = any> {
  set<T>(key: AllowedKey, value: T, opts?: Options): Promise<void> ;
  get<T>(key: AllowedKey, opts?: Options): Promise<T> ;
  delete(key: AllowedKey, opts?: Options): Promise<void> ;
  clear(opts?: Options): Promise<void> ;

  keys(opts?: Options): AsyncIterableIterator<Key>;
  values<T>(opts?: Options): AsyncIterableIterator<T>;
  entries<T>(opts?: Options): AsyncIterableIterator<[Key, T]>;

  backingStore(): BS;
};
