import { mapToObject } from '../util/util';
import { signParamsKey } from '../util/helper';
import { cryptoMd5 } from '../util/crypto';

/**
 * 获取今日推荐详细信息
 * @param {UseModuleParams} params
 * @param { UseAxios } useAxios
 *
 * @return {Promise<UseAxiosResponse>}
 */
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  const data = (params?.id || '').split(',').map(s => ({ ip_id: s }));
  console.log(data);
  dataMap.set('is_publish', 1);
  dataMap.set('data', data);

  return useAxios({
    url: '/openapi/v1/ip',
    encryptType: 'android',
    method: 'POST',
    data: mapToObject(dataMap),
    cookie: params?.cookie || {},
  });

};

export default useModule;