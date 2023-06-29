import { mapToObject } from '../util/util';
import { signatureAndroidParams } from '../util/helper';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const paramsMap = new Map();
  const data = (params?.hash || '').split(',').map( s => ({ audio_id: 0, hash: s, album_audio_id: 0, filename: '' }));
  (params?.audio_id || '').split(',').forEach((s, index) => {
    if (index <= data.length - 1) {
      data[index]['audio_id'] = s || 0;
    }
  });
  (params?.album_audio_id || '').split(',').forEach((s, index) => {
    if (index <= data.length - 1) {
      data[index]['album_audio_id'] = s || 0;
    }
  });
  (params?.filename || '').split(',').forEach((s, index) => {
    if (index <= data.length - 1) {
      data[index]['filename'] = s;
    }
  });

  paramsMap.set('appid', 1005);
  paramsMap.set('clientver', 11669);
  paramsMap.set('count', params?.count || 5);
  paramsMap.set('data', data);
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