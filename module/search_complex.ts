// 综合搜索
import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  dataMap.set('platform', 'AndroidFilter');
  dataMap.set('keyword', params.keywords);
  dataMap.set('page', params?.page || 1);
  dataMap.set('pagesize', params?.pagesize || 30);
  dataMap.set('cursor', 0);

  return useAxios({
    baseURL: 'https://complexsearch.kugou.com',
    url: '/v6/search/complex',
    method: 'GET',
    params: mapToObject(dataMap),
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
}

export default useModule;