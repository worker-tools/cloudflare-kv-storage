# Cloudflare Storage Area

An implementation of the StorageArea ([1],[2],[3]) interface using [Cloudflare Worker's KV](https://developers.cloudflare.com/workers/runtime-apis/kv) 
storage as a backing store.

The goal of this class is ease of use and compatibility with other Storage Area implementations, 
such as [`kv-storage-polyfill`](https://github.com/GoogleChromeLabs/kv-storage-polyfill).

While work on [the specification](https://wicg.github.io/kv-storage/) itself has stopped, 
it's still a good interface for asynchronous data access that feels native to JavaScript.

## Usage

``` js
import { StorageArea } from '@worker-tools/cloudflare-kv-storage';
const storage = new StorageArea('foobar');
```

You can now write cross-platform, cross-worker-env code:

```js
async function myFunc(storage) {
  await storage.set(['foo', 1], ['bar', 2], { expirationTtl: 5 * 60 });
  await storage.get(['foo', 1]); // => ['bar', 2]
}
```

Note that some of the underlying features of Cloudflare KV, such as [`expirationTtl`](https://developers.cloudflare.com/workers/runtime-apis/kv#expiring-keys), are still exposed via the optional options parameter. 
If the underlying implementation isn't a ` CloudflareStorageArea`, the setting simply won't have any effect.

## Prerequisites
In your `wrangler.toml`, make sure to provide a kv namespace binding and a default namespace for the this implementation.

```toml
kv_namespaces = [ 
  { binding = "KV_NAMESPACE", id = "13c...", preview_id = "13c..." }
]

[vars]
  CF_STORAGE_AREA__DEFAULT_KV_NAMESPACE = "KV_NAMESPACE"
```

[1]: https://developers.google.com/web/updates/2019/03/kv-storage
[2]: https://css-tricks.com/kv-storage/
[3]: https://github.com/WICG/kv-storage

## Features

Beyond the cross-worker-env aspects of using StorageArea, CloudflareStorageArea provides a number of quality of life improvements over using Cloudflare's KV directly:

* Support for multiple storage areas within a single KV binding
* Wrapping and Unwrapping of many built-in types, such as `Map` and `Set` (structured clone algorithm)
* Support for non-string keys and complex keys
* Abstraction over KV pagination when listing keys

## Disclaimers

Note that efficiency is not a goal. Specifically, if you have sizable `ArrayBuffer`s,
it's much better to use Cloudflare's KV directly.

