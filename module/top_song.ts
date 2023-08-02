import { mapToObject } from '../util/util';

/**
 * 新歌速递
 * @param {UseModuleParams} params 21608：华语，28：欧美，24045：韩国，24047：日本
 * @param { UseAxios } useAxios
 *
 * @return {Promise<UseAxiosResponse>}
 */
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();

  dataMap.set('rank_id', params?.type || 21608);
  dataMap.set('userid', params?.userid || params?.cookie?.userid || 0);
  dataMap.set('page', params?.page);
  dataMap.set('pagesize', params?.pagesize);
  dataMap.set('tags', []);

  return useAxios({
    url: '/musicadservice/container/v1/newsong_publish',
    encryptType: 'android',
    method: 'POST',
    data: mapToObject(dataMap),
    cookie: params?.cookie || {},
  })
}

export default useModule;