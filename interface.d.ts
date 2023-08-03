export type BufferLike<T = any> = Buffer | string | Object | Record<string | number | symbol, T>;

export type UseAxios = (config: UseAxiosRequestConfig) => Promise<UseAxiosResponse>;
export type UseModuleParams<T = any> = Record<string, T> & { cookie?: Record<string, string> };
export type UseModule = (req: UseModuleParams, useAxios: UseAxios) => Promise<UseAxiosResponse>;

export type ModuleDefinition = {
  identifier?: string;
  route: string;
  module: UseModule;
};

export type EncryptType = 'android' | 'web' | 'register';

export interface UseAxiosRequestConfig<T = any> {
  method: 'get' | 'GET' | 'post' | 'POST';
  url: string;
  baseURL?: string;
  params?: T;
  data?: T;
  headers?: Record<string, string | number>;
  cookie?: { [key: string]: string | number };
  encryptType: EncryptType;
  encryptKey?: boolean;
  clearDefaultParams?: boolean;
  notSign?: boolean;

  ip?: string;
  realIP?: string;
}

export interface UseAxiosResponse<T = any> {
  status: number;
  body: T;
  cookie: string[];
  headers?: Record<string, string>;
}

export type AesEncrypt = { key: string; str: string };

export type HelperParams<T = any> = Record<string | number | symbol, T> | { [key: string | symbol]: T };

export function cryptoAesEncrypt(data: BufferLike): AesEncrypt;
export function cryptoAesEncrypt(data: BufferLike, opt: { key: string }): AesEncrypt;
export function cryptoAesEncrypt(data: BufferLike, opt: { key: string; iv: string }): string;

export function cryptoRSAEncrypt(data: BufferLike): string;
export function cryptoRSAEncrypt(data: BufferLike, publicKey: string): string;
