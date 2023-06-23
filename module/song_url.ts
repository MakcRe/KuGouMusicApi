// 新碟上架
import { mapToObject } from '../util/util';

// 华语: 1,欧美: 2,日本: 3,韩国: 4, 空为推荐
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  dataMap.set('hash', params?.hash || '');
  dataMap.set('vipType', params?.cookie?.vip_type || params?.vipType || 0); // 该参数不影响url获取
  dataMap.set('vipToken', params?.cookie?.vip_token || params?.vipToken || ''); // 该参数不影响url获取
  dataMap.set('behavior', 'play');
  dataMap.set('pid', 2);
  dataMap.set('cmd', 26);
  dataMap.set('version', 9541);
  dataMap.set('pidversion', 3001);
  dataMap.set('IsFreePart', params?.multitrack === '1' ? 3 : 1);

  return useAxios({
    url: '/v3/url',
    method: 'GET',
    params: mapToObject(dataMap),
    encryptType: 'android',
    headers: { 'x-router': 'tracker.kugou.com' },
    encryptKey: true,
    cookie: params?.cookie || {},
  });
}

export default useModule;