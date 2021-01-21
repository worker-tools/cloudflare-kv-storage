# Cloudflare Storage Area

An implementation of the StorageArea ([1],[2],[3]) interface using [Cloudflare Worker's KV](https://developers.cloudflare.com/workers/runtime-apis/kv) 
storage as a backing store.

The goal of this class is ease of use and compatibility with other Storage Area implementations, 
such as [`kv-storage-polyfill`](https://github.com/GoogleChromeLabs/kv-storage-polyfill).

While work on [the specification](https://wicg.github.io/kv-storage/) itself has stopped, 
it's still a good interface for asynchronous data access that feels native to JavaScript.

## Usage

``` ts
import { StorageArea, CloudflareStorageArea } from '@worker-tools/cloudflare-kv-storage';

// Pass a `KVNamespace` or the name of a kv namespace bound to this worker:
const storage = new CloudflareStorageArea('MY_FIRST_KV');
```

You can now write cross-platform, cross-worker-env code:

```ts
async function myFunc(sto: StorageArea) {
  await sto.set(['foo', 1], ['bar', 2], { expirationTtl: 5 * 60 });
  await sto.get(['foo', 1]); // => ['bar', 2]
}
```

Note that some of the underlying features of Cloudflare KV, such as [`expirationTtl`](https://developers.cloudflare.com/workers/runtime-apis/kv#expiring-keys), 
are still exposed via the optional options parameter[^1]. 
If the underlying implementation isn't a ` CloudflareStorageArea`, the setting simply won't have an effect.

[1]: https://developers.google.com/web/updates/2019/03/kv-storage
[2]: https://css-tricks.com/kv-storage/
[3]: https://github.com/WICG/kv-storage


## Disclaimers

Note that efficiency is not a goal. Specifically, if you have sizable `ArrayBuffer`s,
it's much better to use Cloudflare's KV directly.

***

[^1]: I took the liberty of adding the options record to the base interface, since 
      a) standardization has stopped anyway 
      b) if an extra parameters were to be added to the spec, there's a good chance it will be an record as well.
