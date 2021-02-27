import Typeson from 'typeson';
import structuredCloningThrowing from 'typeson-registry/dist/presets/structured-cloning-throwing';
import { Encoder as MsgPackEncoder, Decoder as MsgPackDecoder } from 'msgpackr';
// import { Encoder as CBOREncoder, Decoder as CBORDecoder } from 'cbor-x';

import { KVPutOptions } from '.';

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
const TSON = new Typeson().register(structuredCloningThrowing);

export interface KVPacker {
  set(kv: KVNamespace, key: string, value: any, opts?: any): Promise<void>;
  get(kv: KVNamespace, key: string, opts?: any): Promise<any>;
}

export class TypesonPacker implements KVPacker {
  async set(kv: KVNamespace, key: string, value: any, opts?: KVPutOptions) {
    await kv.put(key, JSON.stringify(TSON.encapsulate(value)), opts);
  }
  async get(kv: KVNamespace, key: string) {
    return TSON.revive(await kv.get(key, 'json'));
  }
}

// export class CBORPacker implements KVPacker {
//   async set(kv: KVNamespace, key: string, value: any, opts?: any): Promise<void> {
//     await kv.put(key, new CBOREncoder({ structuredClone: true }).encode(value), opts);
//   }
//   async get(kv: KVNamespace, key: string): Promise<any> {
//     const data = await kv.get(key, 'arrayBuffer');
//     return data && new CBORDecoder({ structuredClone: true }).decode(new Uint8Array(data) as Buffer);
//   }
// }

export class MsgPacker implements KVPacker {
  async set(kv: KVNamespace, key: string, value: any, opts?: any): Promise<void> {
    await kv.put(key, new MsgPackEncoder({ structuredClone: true }).encode(value), opts);
  }
  async get(kv: KVNamespace, key: string): Promise<any> {
    const data = await kv.get(key, 'arrayBuffer');
    return data && new MsgPackDecoder({ structuredClone: true }).decode(new Uint8Array(data));
  }
}
