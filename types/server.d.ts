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
  headers?: Record<string, any>,
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
  cookie: string[]
}

declare type UseAxios = (config: UseAxiosRequestConfig) => Promise<UseAxiosResponse>;

declare type UseModule = (req: Record<string, any>, useAxios: UseAxios) => Promise<UseAxiosResponse>;

declare type UseModuleParams<T = any> =  { [key: string] : T };