// 歌词搜索
import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  dataMap.set('album_audio_id', params?.album_audio_id || 0);
  dataMap.set('appid', 1005);
  dataMap.set('clientver', 11309);
  dataMap.set('duration', 0);
  dataMap.set('hash', params?.hash || '');
  dataMap.set('keyword', params?.keyword || '');
  dataMap.set('lrctxt', 1);
  dataMap.set('man', 'no');

  return useAxios({
    baseURL: 'https://lyrics.kugou.com',
    url: '/v1/search',
    method: 'GET',
    params: mapToObject(dataMap),
    cookie: params?.cookie || {},
    encryptType: 'android',
    clearDefaultParams: true,
    notSign: true
  });
}

export default useModule;