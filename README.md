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

<br/>

--------

<br/>

<p align="center"><a href="https://workers.tools"><img src="https://workers.tools/assets/img/logo.svg" width="100" height="100" /></a>
<p align="center">This module is part of the Worker Tools collection<br/>⁕

[Worker Tools](https://workers.tools) are a collection of TypeScript libraries for writing web servers in [Worker Runtimes](https://workers.js.org) such as Cloudflare Workers, Deno Deploy and Service Workers in the browser. 

If you liked this module, you might also like:

- 🧭 [__Worker Router__][router] --- Complete routing solution that works across CF Workers, Deno and Service Workers
- 🔋 [__Worker Middleware__][middleware] --- A suite of standalone HTTP server-side middleware with TypeScript support
- 📄 [__Worker HTML__][html] --- HTML templating and streaming response library
- 📦 [__Storage Area__][kv-storage] --- Key-value store abstraction across [Cloudflare KV][cloudflare-kv-storage], [Deno][deno-kv-storage] and browsers.
- 🆗 [__Response Creators__][response-creators] --- Factory functions for responses with pre-filled status and status text
- 🎏 [__Stream Response__][stream-response] --- Use async generators to build streaming responses for SSE, etc...
- 🥏 [__JSON Fetch__][json-fetch] --- Drop-in replacements for Fetch API classes with first class support for JSON.
- 🦑 [__JSON Stream__][json-stream] --- Streaming JSON parser/stingifier with first class support for web streams.

Worker Tools also includes a number of polyfills that help bridge the gap between Worker Runtimes:
- ✏️ [__HTML Rewriter__][html-rewriter] --- Cloudflare's HTML Rewriter for use in Deno, browsers, etc...
- 📍 [__Location Polyfill__][location-polyfill] --- A `Location` polyfill for Cloudflare Workers.
- 🦕 [__Deno Fetch Event Adapter__][deno-fetch-event-adapter] --- Dispatches global `fetch` events using Deno’s native HTTP server.

[router]: https://workers.tools/router
[middleware]: https://workers.tools/middleware
[html]: https://workers.tools/html
[kv-storage]: https://workers.tools/kv-storage
[cloudflare-kv-storage]: https://workers.tools/cloudflare-kv-storage
[deno-kv-storage]: https://workers.tools/deno-kv-storage
[kv-storage-polyfill]: https://workers.tools/kv-storage-polyfill
[response-creators]: https://workers.tools/response-creators
[stream-response]: https://workers.tools/stream-response
[json-fetch]: https://workers.tools/json-fetch
[json-stream]: https://workers.tools/json-stream
[request-cookie-store]: https://workers.tools/request-cookie-store
[extendable-promise]: https://workers.tools/extendable-promise
[html-rewriter]: https://workers.tools/html-rewriter
[location-polyfill]: https://workers.tools/location-polyfill
[deno-fetch-event-adapter]: https://workers.tools/deno-fetch-event-adapter

Fore more visit [workers.tools](https://workers.tools).