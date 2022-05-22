// deno-lint-ignore-file no-explicit-any
import 'https://cdn.skypack.dev/@cloudflare/workers-types@3.11.0?dts'

import { default as typeson } from 'https://cdn.skypack.dev/typeson@7.0.2?dts';
import { structuredCloningThrowing } from 'https://cdn.skypack.dev/typeson-registry@3.0.0?dts';

import { Encoder as BinaryEncoder, Decoder as BinaryDecoder } from 'https://cdn.skypack.dev/msgpackr@1.5.5?dts';

const TSON = new typeson.Typeson().register([structuredCloningThrowing]);

export interface KVPacker {
  set(kv: KVNamespace, key: string, value: any, opts?: any): Promise<void>;
  get(kv: KVNamespace, key: string, opts?: any): Promise<any>;
}

export class TypesonPacker implements KVPacker {
  async set(kv: KVNamespace, key: string, value: any, opts?: KVNamespacePutOptions) {
    await kv.put(key, JSON.stringify(TSON.encapsulate(value)), opts);
  }
  async get(kv: KVNamespace, key: string) {
    return TSON.revive(await kv.get(key, 'json'));
  }
}

export class MsgPacker implements KVPacker {
  async set(kv: KVNamespace, key: string, value: any, opts?: any): Promise<void> {
    await kv.put(key, new BinaryEncoder({ structuredClone: true }).encode(value), opts);
  }
  async get(kv: KVNamespace, key: string): Promise<any> {
    const data = await kv.get(key, 'arrayBuffer');
    return data && new BinaryDecoder({ structuredClone: true }).decode(new Uint8Array(data));
  }
}
