import { mapToObject } from '../util/util';
import { signParamsKey } from '../util/helper';
import { cryptoMd5 } from '../util/crypto';

/**
 * 歌单
 * categoryid 0：推荐，11292：HI-RES
 *
 * @param {UseModuleParams} params
 * @param { UseAxios } useAxios
 */

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  const specialRecommend = new Map();
  dataMap.set('appid', 1005);
  dataMap.set('mid', cryptoMd5(params?.dfid || params?.cookie?.dfid || '-'));
  dataMap.set('clientver', 11309);
  dataMap.set('platform', 'android');
  dataMap.set('clienttime', (Date.now() / 1000).toFixed(0));
  dataMap.set('userid', params?.userid || params?.cookie?.userid || 0);
  dataMap.set('module_id', params?.module_id || 4);
  dataMap.set('page', params?.page || 1);
  dataMap.set('pagesize', params?.pagesize || 30);
  dataMap.set('key', signParamsKey(dataMap.get('clienttime')));
  specialRecommend.set('withtag', params?.withtag || 1);
  specialRecommend.set('withsong', params?.withsong || 1);
  specialRecommend.set('sort', params?.sort || 1);
  specialRecommend.set('ugc', 1);
  specialRecommend.set('is_selected', 0);
  specialRecommend.set('withrecommend', 1);
  specialRecommend.set('area_code', 1);
  specialRecommend.set('categoryid', params?.category_id || 0);
  dataMap.set('special_recommend', specialRecommend);

  return useAxios({
    url: '/specialrec.service/special_recommend',
    encryptType: 'android',
    method: 'POST',
    data: mapToObject(dataMap),
    cookie: params?.cookie || {},
  });
};

export default useModule;