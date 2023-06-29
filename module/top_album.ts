// 新碟上架
import { mapToObject } from '../util/util';

// 华语: 1,欧美: 2,日本: 3,韩国: 4, 空为推荐
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  dataMap.set('apiver', 1);
  dataMap.set('token', params?.token || params?.cookie?.token || '');
  dataMap.set('page', params?.page || 1);
  dataMap.set('pagesize', params?.pagesize || 30);
  dataMap.set('withpriv', 1);

  return useAxios({
    url: '/musicadservice/v1/mobile_newalbum_sp',
    method: 'POST',
    data: mapToObject(dataMap),
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
}

export default useModule;