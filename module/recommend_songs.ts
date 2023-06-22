// 每日推荐歌曲
import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  dataMap.set('platform', params?.platform || 'android');
  dataMap.set('userid', params?.userid || params?.cookie?.userid || '0');

  console.log(dataMap);

  return useAxios({
    url: '/everyday_song_recommend',
    method: 'POST',
    data: mapToObject(dataMap),
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: {'x-router': 'everydayrec.service.kugou.com'}
  });
}

export default useModule;