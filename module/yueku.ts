import { mapToObject } from '../util/util';
import { signParamsKey } from '../util/helper';
import { cryptoMd5 } from '../util/crypto';

/**
 * 获取安卓乐库相关内容
 * @param {UseModuleParams} params
 * @param { UseAxios } useAxios
 *
 * @return {Promise<UseAxiosResponse>}
 */
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  return useAxios({
    url: '/v1/yueku/recommend_v2',
    encryptType: 'android',
    method: 'GET',
    params: { operator: 7, plat: 0, type: 11, area_code: 1, req_multi: 1 },
    cookie: params?.cookie || {},
    headers: { 'x-router': 'service.mobile.kugou.com'},
  })
}

export default useModule;