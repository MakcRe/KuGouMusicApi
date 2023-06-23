// 歌词获取
import { decodeLyrics, mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  dataMap.set('ver', 1);
  dataMap.set('client', 'android');
  dataMap.set('id', params?.id); // 歌词id
  dataMap.set('accesskey', params?.accesskey); // 歌词key
  dataMap.set('fmt', params?.fmt || 'krc'); // 歌词类型
  dataMap.set('charset', 'utf8');

  return new Promise((resolve, reject) => {
    useAxios({
      baseURL: 'https://lyrics.kugou.com',
      url: '/download',
      method: 'GET',
      params: mapToObject(dataMap),
      cookie: params?.cookie || {},
      encryptType: 'android',
    }).then(res => {
      if (params?.decode) {
        if (res.body?.content) {
          res.body['decodeContent'] = params?.fmt == 'lrc' ? Buffer.from(res.body?.content, 'base64').toString() :decodeLyrics(res.body.content);
          resolve(res);
          return;
        }
      }
      resolve(res);
    }).catch(e => reject(e));
  });
}

export default useModule;