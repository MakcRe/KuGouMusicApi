// 新碟上架
import { mapToObject } from '../util/util';

// 华语: 1,欧美: 2,日本: 3,韩国: 4, 空为推荐
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  dataMap.set('apiver', 1);
  dataMap.set('type', params?.type || '');
  dataMap.set('page', params?.page || 1);
  dataMap.set('pagesize', params?.pagesize || 30);
  dataMap.set('area_code', 1);
  dataMap.set('sorttype', 1);
  dataMap.set('withpriv', 1);

  return useAxios({
    url: '/ocean/v6/album/list',
    method: 'GET',
    params: mapToObject(dataMap),
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
}

export default useModule;