export type Repeatable<T> = T | T[];
export type Awaitable<T> = T | Promise<T>;
export type Callable<T> = T | (() => T);
export type Primitive = undefined | boolean | number | string | BigInt | Symbol;
