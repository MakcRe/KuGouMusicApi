import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();

  dataMap.set('businessid', 5);
  dataMap.set('mobile', params?.mobile);
  dataMap.set('plat', 3);


  return useAxios({
    url: '/v7/send_mobile_code',
    method: 'POST',
    data: mapToObject(dataMap),
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: { 'x-router': 'loginservice.kugou.com' },
  });
}

export default useModule;