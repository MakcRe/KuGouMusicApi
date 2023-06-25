// 主题歌单
import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {


  const dataMap = new Map();


  dataMap.set('platform', 'android');
  dataMap.set('clientver', 11629);
  dataMap.set('clienttime', Date.now());
  dataMap.set('area_code', 1);
  dataMap.set('module_id', 1);
  dataMap.set('userid', params?.userid || params?.cookie?.userid || 0);

  return useAxios({
    url: '/v2/getthemelist',
    method: 'POST',
    encryptType: 'android',
    data: mapToObject(dataMap),
    cookie: params?.cookie || {},
    headers: { 'x-router': 'everydayrec.service.kugou.com' }
  })
}

export default useModule;
