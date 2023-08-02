import { mapToObject } from '../util/util';


/**
 * 今日推荐
 * @param {UseModuleParams} params
 * @param { UseAxios } useAxios
 *
 * @return {Promise<UseAxiosResponse>}
 */
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  dataMap.set('tags', []);

  return new Promise((resolve, reject) => {
    useAxios({
      url: '/musicadservice/v1/daily_recommend',
      encryptType: 'android',
      method: 'POST',
      data: mapToObject(dataMap),
      cookie: params?.cookie || {},
    }).then(resp => {
      console.log(resp.body.status);
      if (resp.body.status == 1) {
        const list = resp.body.data.list;
        list.forEach((s, index) => {
          const inner_url: string = s?.extra?.inner_url;
          const findIndex = inner_url.lastIndexOf('ip_id');
          if (findIndex !== -1) {
            list[index]['ip_id'] = Number(inner_url.substring(findIndex + 6));
          }
        })
      }
      resolve(resp);
    }).catch(e => reject(e));
  });
}

export default useModule;