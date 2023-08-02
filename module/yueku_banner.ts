import { mapToObject } from '../util/util';

/**
 * 获取乐库下的频道
 * @param {UseModuleParams} params
 * @param { UseAxios } useAxios
 *
 * @return {Promise<UseAxiosResponse>}
 */
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  dataMap.set('plat', 0);
  dataMap.set('channel', 201);
  dataMap.set('operator', 7);
  dataMap.set('networktype', 2);
  dataMap.set('userid', params?.userid || params?.cookie?.userid || 0);
  dataMap.set('vip_type', 0);
  dataMap.set('m_type', 1);
  dataMap.set('tags', []);
  dataMap.set('apiver', 5);
  dataMap.set('ability', 2);
  dataMap.set('mode', 'normal');


  return useAxios({
    url: '/ads.gateway/v3/listen_banner',
    encryptType: 'android',
    method: 'POST',
    data: mapToObject(dataMap),
    cookie: params?.cookie || {},
  })
}

export default useModule;