import { mapToObject } from '../util/util';
import { signatureAndroidParams } from '../util/helper';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const paramsMap = new Map();
  // [{ 'audio_id': params?.audio_id || 0, hash: params?.hash, filename: params?.filename || '', album_audio_id: params?.album_audio_id || 0 }]
  // [{"album_audio_id":89488966,"audio_id":0,"hash":"d06f97d2b923f89c755e2cfceccaa69c","filename":""}]

  paramsMap.set('appid', 1005);
  paramsMap.set('clientver', 11669);
  paramsMap.set('count', params?.count || 5);
  paramsMap.set('data', [{ 'audio_id': params?.audio_id || 0, hash: params?.hash, filename: params?.filename || '', album_audio_id: params?.album_audio_id || 0 }]);
  paramsMap.set('isCdn', 1);
  paramsMap.set('publish_time', 1);
  paramsMap.set('show_authors', 1);

  const objParams = mapToObject(paramsMap);
  const query = Object.keys(objParams).map(s => `${s}=${encodeURIComponent(typeof objParams[s] === 'object' ? JSON.stringify(objParams[s]) : objParams[s])}`);

  const signature = signatureAndroidParams(objParams);




  return useAxios({
    baseURL: 'https://expendablekmr.kugou.com',
    url: `/v2/author_image/audio?${query.join('&')}`,
    method: 'GET',
    encryptType: 'android',
    params: { signature },
    cookie: params?.cookie || {},
    notSign: true,
    clearDefaultParams: true,
  });


};

export default useModule;