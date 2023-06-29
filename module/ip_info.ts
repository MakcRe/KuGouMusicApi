import { mapToObject } from '../util/util';
import { signParamsKey } from '../util/helper';
import { cryptoMd5 } from '../util/crypto';

/**
 * 获取今日推荐信息，有可能为空
 * @param {UseModuleParams} params
 * @param { UseAxios } useAxios
 *
 * @return {Promise<UseAxiosResponse>}
 */
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();

  dataMap.set('ip', params?.id);
  dataMap.set('page', params?.page || 1);
  dataMap.set('pagesize', params?.pagesize || 30);


  return useAxios({
    url: '/ocean/v6/pubsongs/list_info_for_ip',
    encryptType: 'android',
    method: 'POST',
    params: mapToObject(dataMap),
    cookie: params?.cookie || {},
  });

};

export default useModule;