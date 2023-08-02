declare type UseAxios = (config: UseAxiosRequestConfig) => Promise<UseAxiosResponse>;

declare type UseModuleParams<T = any> =  Record<string, T> & { cookie?: Record<string, string> };
declare type UseModule = (req: UseModuleParams, useAxios: UseAxios) => Promise<UseAxiosResponse>;

declare type ModuleDefinition = {
  identifier?: string,
  route: string,
  module: UseModule,
}

declare type EncryptType = 'android' | 'web' | 'register';

declare interface UseAxiosRequestConfig<T = any>{
  method: 'get' | 'GET' | 'post' | 'POST',
  url: string,
  baseURL?: string,
  params?: T,
  data?: T,
  headers?: Record<string, string | number>,
  cookie?: { [key: string]: string | number  },
  encryptType: EncryptType,
  encryptKey?: boolean,
  clearDefaultParams?: boolean,
  notSign?: boolean,

  ip?: string,
  realIP?: string

}

declare interface UseAxiosResponse<T = any> {
  status: number;
  body: T,
  cookie: string[],
  headers?: Record<string, string>
}


