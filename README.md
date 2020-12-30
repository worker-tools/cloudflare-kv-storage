# Cloudflare Storage Area

An implementation of the [`StorageArea`](https://wicg.github.io/kv-storage/) interface using Cloudflare Worker's KV storage as a backing store.

The goal of this class is ease of use and compatibility with other Storage Area implementations, 
such as <https://github.com/GoogleChromeLabs/kv-storage-polyfill>.

While work on [the specification](https://wicg.github.io/kv-storage/) itself has stopped, 
it's still a good interface for asynchronous data access that feels native to JavaScript.

Note that efficiency is not a goal. Specifically, if you have sizable `ArrayBuffer`s,
it's much better to use Cloudflare's KV directly.