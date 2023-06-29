
declare type BufferLike<T = any> = Buffer | string | Object | Record<string | number | symbol, T>;

declare type AesEncrypt = { key: string, str: string };

declare type HelperParams <T = any> = Map<T, T> |  Record<string | number | symbol, T>