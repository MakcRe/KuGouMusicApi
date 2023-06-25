// 获取歌单详情
import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  const ids = (params?.ids || '').split(',').map(s => ({'global_collection_id': s }));
  dataMap.set('data', ids);
  dataMap.set('userid', params?.userid || params?.cookie?.userid || 0);
  dataMap.set('token', params?.token || params?.cookie?.token || '');



  return useAxios({
    url: '/v3/get_list_info',
    method: 'POST',
    encryptType: 'android',
    data: mapToObject(dataMap),
    cookie: params?.cookie || {},
    headers: {'x-router': 'pubsongs.kugou.com'}
  })


}

export default useModule;