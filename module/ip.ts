import { mapToObject } from '../util/util';
import { signParamsKey } from '../util/helper';
import { cryptoMd5 } from '../util/crypto';

/**
 * 获取 今日推荐相关信息
 * @param {UseModuleParams} params
 * @param { UseAxios } useAxios
 *
 * @return {Promise<UseAxiosResponse>}
 */
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  dataMap.set('is_publish', 1);
  dataMap.set('ip_id', params?.id);
  dataMap.set('sort', 3);
  dataMap.set('page', params?.page || 1);
  dataMap.set('pagesize', params?.pagesize || 30);
  dataMap.set('query', 1);

  const type = ['audios', 'albums', 'videos', 'author_list'].includes(params?.type) ? params.type : 'audios';

  return useAxios({
    url: `/openapi/v1/ip/${type}`,
    encryptType: 'android',
    method: 'POST',
    data: mapToObject(dataMap),
    cookie: params?.cookie || {},
  });

};

export default useModule;