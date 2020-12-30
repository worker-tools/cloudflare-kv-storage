# Cloudflare Storage Area

An implementation of the [`StorageArea`](https://wicg.github.io/kv-storage/) interface using Cloudflare Worker's KV storage as a backing store.

The goal of this class is ease of use and compatibility with other Storage Area implementations, 
such as <https://github.com/GoogleChromeLabs/kv-storage-polyfill>.

While work on [the specification](https://wicg.github.io/kv-storage/) itself has stopped, 
it's still a good interface for asynchronous data access that feels native to JavaScript.

Note that efficiency is not a goal. Specifically, if you have sizable `ArrayBuffer`s,
it's much better to use Cloudflare's KV directly.

## Usage

``` ts
import { StorageArea, KVStorageArea } from '@werker/cloudflare-kv-storage';

// Pass a `KVNamespace` or the name of a kv namespace bound to this worker:
const storage = new KVStorageArea(self.MY_FIRST_KV);
const sessionStore = new KVStorageArea('SESSION_KV');
```

You can now write cross-platform, cross-worker-env code:

```ts
async function myFunc(sto: StorageArea) {
  await sto.set(['foo', 1], ['bar', 2], { expirationTtl: 5 * 60 });
  await sto.get(['foo', 1]); // => ['bar', 2]
}
```

Note that some of the underlying features of Cloudflare KV, such as TTL, are still exposed via the optional options parameter. If the underlying implementation isn't a ` KVStorageArea`, the settings simply won't have an effect.


<!-- ### Advanced
By default, objects are stored as JSON strings. 
This makes inspecting values in the Cloudflare dashboard easier.

If you want to save some bytes by storing data in a binary format, you can provider your own `KVPacker`.
E.g.:

```ts
import msgpack from 'msgpack-lite';
import { KVStorageArea, KVPacker } from '@werker/cloudflare-kv-storage';

export class MsgPacker implements KVPacker {
  pack(typeson: any): Uint8Array { 
    return msgpack.encode(typeson);
  }
  async unpack(kv: KVNamespace, key: string) { 
    const ab = await kv.get(key, 'arrayBuffer');
    return ab && msgpack.decode(ab); 
  }
}

const storage1 = new KVStorageArea(self.MY_FIRST_KV, { packer: new MsgPacker() });
```  -->