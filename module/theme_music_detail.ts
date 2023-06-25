// 热门好歌精选
import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();

  dataMap.set('platform', 'android');
  dataMap.set('clienttime', Math.floor(Date.now() / 1000))
  dataMap.set('theme_category_id', params?.id || '');
  dataMap.set('show_theme_category_id', 0);
  dataMap.set('userid', params?.userid || params?.cookie?.userid || 0);
  dataMap.set('module_id', 508);

  return useAxios({
    url: '/everydayrec.service/v1/theme_category_recommend',
    encryptType: 'android',
    method: 'POST',
    data: mapToObject(dataMap),
    cookie: params?.cookie || {},
  })
}

export default useModule;