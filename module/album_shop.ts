// 唱片店
import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {

  return useAxios({
    url: '/zhuanjidata/v3/album_shop_v2/get_classify_data',
    method: 'GET',
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
}

export default useModule;