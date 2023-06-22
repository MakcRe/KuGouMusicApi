// 专辑音乐列表
import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  dataMap.set('album_id', params.id);
  dataMap.set('is_buy', params?.is_buy || '');
  dataMap.set('page', params?.page || 1);
  dataMap.set('pagesize', params?.pagesize || 30);

  return useAxios({
    url: '/v1/album_audio/lite',
    method: 'POST',
    data: mapToObject(dataMap),
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: { 'x-router': 'openapi.kugou.com', 'kg-tid': '255' },
  });
}

export default useModule;