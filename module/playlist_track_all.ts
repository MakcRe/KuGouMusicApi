// 获取歌单所有歌曲

import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {

  const paramsMap = new Map();
  paramsMap.set('plat', 1);
  paramsMap.set('type', 1);
  paramsMap.set('module', 'NONE');
  paramsMap.set('page', params?.page || 1);
  paramsMap.set('pagesize', params?.pagesize || 30);
  paramsMap.set('global_collection_id', params?.id);


  return useAxios({
    baseURL: 'https://pubsongscdn.kugou.com',
    url: '/v2/get_other_list_file',
    method: 'GET',
    encryptType: 'android',
    params: mapToObject(paramsMap),
    cookie: params?.cookie || {},
    headers: { 'x-router': 'pubsongscdn.kugou.com' }
  })


}

export default useModule;