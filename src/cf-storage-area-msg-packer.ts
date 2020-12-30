// import msgpack from 'msgpack-lite';
// import { KVPacker } from './cf-storage-area';

// export class MsgPacker implements KVPacker {
//   pack(x: any): Uint8Array { 
//     return msgpack.encode(x);
//   }
//   async unpack(kv: KVNamespace, key: string) { 
//     const ab = await kv.get(key, 'arrayBuffer');
//     return ab && msgpack.decode(ab); 
//   }
// }
