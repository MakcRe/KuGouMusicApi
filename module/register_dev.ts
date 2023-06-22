import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();

  dataMap.set('mid', params?.mid || '');
  dataMap.set('uuid', params?.uuid || '');
  dataMap.set('appid', '1014');
  dataMap.set('userid', params?.userid || '0')

  return useAxios({
    baseURL: 'https://userservice.kugou.com',
    url: '/risk/v1/r_register_dev',
    method: 'POST',
    data: Buffer.from(JSON.stringify(mapToObject(dataMap))).toString('base64'),
    params: { ...mapToObject(dataMap), 'p.token': '', platid: 4 },
    encryptType: 'register',
    cookie: params?.cookie || {},
  });
}

export default useModule;