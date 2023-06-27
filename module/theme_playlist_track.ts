// 获取主题歌单说有歌曲
import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {


  const dataMap = new Map();


  dataMap.set('platform', 'android');
  dataMap.set('clientver', 11629);
  dataMap.set('clienttime', Date.now());
  dataMap.set('area_code', 1);
  dataMap.set('module_id', 1);
  dataMap.set('userid', params?.userid || params?.cookie?.userid || 0);
  dataMap.set('theme_id', params?.theme_id);
  // dataMap.set('pagesize', params?.pagesize || 30);
  // dataMap.set('page', params?.page || 1);

  return useAxios({
    url: '/v2/gettheme_songidlist',
    method: 'POST',
    encryptType: 'android',
    data: mapToObject(dataMap),
    cookie: params?.cookie || {},
    headers: { 'x-router': 'everydayrec.service.kugou.com' }
  })
}

export default useModule;
