// 获取音效歌单
import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();

  dataMap.set('page', params?.page || 1);
  dataMap.set('pagesize', params?.pagesize || 30);

  return useAxios({
    url: '/pubsongs/v1/get_sound_effect_list',
    method: 'POST',
    encryptType: 'android',
    data: mapToObject(dataMap),
    cookie: params?.cookie || {},
  })
}

export default useModule;