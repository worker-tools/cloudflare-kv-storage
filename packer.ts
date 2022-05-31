// deno-lint-ignore-file no-explicit-any
// import 'https://cdn.skypack.dev/@cloudflare/workers-types@3.11.0?dts'

import * as Structured from 'https://ghuc.cc/worker-tools/structured-json/index.ts';
import { Encoder as BinaryEncoder, Decoder as BinaryDecoder } from 'https://cdn.skypack.dev/msgpackr@1.5.5?dts';

export interface KVPacker {
  // @ts-ignore: deno only
  set(kv: KVNamespace, key: string, value: any, opts?: any): Promise<void>;
  // @ts-ignore: deno only
  get(kv: KVNamespace, key: string, opts?: any): Promise<any>;
}

export class StructuredPacker implements KVPacker {
  // @ts-ignore: deno only
  async set(kv: KVNamespace, key: string, value: any, opts?: KVNamespacePutOptions) {
    await kv.put(key, Structured.stringify(value), opts);
  }
  // @ts-ignore: deno only
  async get(kv: KVNamespace, key: string) {
    return Structured.fromJSON(await kv.get(key, 'json'));
  }
}

/** @deprecated This doesn't match structured clone algorithm close enough. Not recommended */
export class MsgPacker implements KVPacker {
  // @ts-ignore: deno only
  async set(kv: KVNamespace, key: string, value: any, opts?: any): Promise<void> {
    await kv.put(key, new BinaryEncoder({ structuredClone: true }).encode(value), opts);
  }
  // @ts-ignore: deno only
  async get(kv: KVNamespace, key: string): Promise<any> {
    const data = await kv.get(key, 'arrayBuffer');
    return data && new BinaryDecoder({ structuredClone: true }).decode(new Uint8Array(data));
  }
}

export { StructuredPacker as TypesonPacker }
