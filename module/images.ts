import { mapToObject } from '../util/util';
import { signatureAndroidParams } from '../util/helper';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const paramsMap = new Map();

  const data = (params?.hash || '').split(',').map( s => ({ album_id: 0, hash: s, album_audio_id: 0 }));
  (params?.album_id || '').split(',').forEach((s, index) => {
    if (index <= data.length - 1) {
      data[index]['album_id'] = s || 0;
    }
  });
  (params?.album_audio_id || '').split(',').forEach((s, index) => {
    if (index <= data.length - 1) {
      data[index]['album_audio_id'] = s || 0;
    }
  });

  paramsMap.set('album_image_type', -3);
  paramsMap.set('appid', 1005);
  paramsMap.set('author_image_type', '3,4,5');
  paramsMap.set('clientver', 11669);
  paramsMap.set('count', params?.count || 5);
  paramsMap.set('data', data);
  paramsMap.set('isCdn', 1);
  paramsMap.set('publish_time', 1);

  const objParams = mapToObject(paramsMap);
  const query = Object.keys(objParams).map(s => `${s}=${encodeURIComponent(typeof objParams[s] === 'object' ? JSON.stringify(objParams[s]) : objParams[s] )}`)

  const signature = signatureAndroidParams(objParams);


  return useAxios({
    baseURL: 'https://expendablekmr.kugou.com',
    url: `/container/v2/image?${query.join('&')}`,
    method: 'GET',
    encryptType: 'android',
    params: { signature },
    cookie: params?.cookie || {},
    notSign: true,
    clearDefaultParams: true,
  });


};

export default useModule;