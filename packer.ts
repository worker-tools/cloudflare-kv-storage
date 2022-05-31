// deno-lint-ignore-file no-explicit-any
// import 'https://cdn.skypack.dev/@cloudflare/workers-types@3.11.0?dts'

import * as typeson from 'https://cdn.skypack.dev/typeson@7.0.2?dts';
import { structuredCloningThrowing } from 'https://unpkg.com/typeson-registry@3.0.0/dist/index.js';

import { Encoder as BinaryEncoder, Decoder as BinaryDecoder } from 'https://cdn.skypack.dev/msgpackr@1.5.5?dts';

const Typeson = 'default' in typeson ? typeson.default.Typeson : typeson.Typeson;
const TSON = new Typeson().register([structuredCloningThrowing]);

export interface KVPacker {
  // @ts-ignore: deno only
  set(kv: KVNamespace, key: string, value: any, opts?: any): Promise<void>;
  // @ts-ignore: deno only
  get(kv: KVNamespace, key: string, opts?: any): Promise<any>;
}

export class TypesonPacker implements KVPacker {
  // @ts-ignore: deno only
  async set(kv: KVNamespace, key: string, value: any, opts?: KVNamespacePutOptions) {
    await kv.put(key, JSON.stringify(TSON.encapsulate(value)), opts);
  }
  // @ts-ignore: deno only
  async get(kv: KVNamespace, key: string) {
    return TSON.revive(await kv.get(key, 'json'));
  }
}

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
