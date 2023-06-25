// 获取歌单分类
import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {

  const dataMap = new Map();

  dataMap.set('tag_type', 'collection');
  dataMap.set('tag_id', 0);
  dataMap.set('source', 3);

  return useAxios({
    url: '/pubsongs/v1/get_tags_by_type',
    method: 'POST',
    encryptType: 'android',
    data: mapToObject(dataMap),
    cookie: params?.cookie || {},
  })
}

export default useModule;