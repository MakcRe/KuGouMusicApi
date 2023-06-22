
declare type BufferLike = Buffer | string | Object | { [key: string | number | symbol]: any };

declare type AesEncrypt = { key: string, str: string };

declare type HelperParams <T = any> = Map<T, T> |  { [key: string | number | symbol]: T }