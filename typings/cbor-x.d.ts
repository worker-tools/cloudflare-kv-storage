declare module 'cbor-x/browser' {
  export class Encoder { constructor(opts?: { structuredClone: boolean }); encode<T = any>(x: T): Uint8Array }
  export class Decoder { constructor(opts?: { structuredClone: boolean }); decode<T = any>(x: Uint8Array): T }
}