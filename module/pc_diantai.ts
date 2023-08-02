import { mapToObject } from "../util/util";

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const userid = params?.cookie?.userid || params?.userid || 0;

  const dataMap =  new Map();
  dataMap.set('isvip', 0);
  dataMap.set('userid', userid);
  dataMap.set('vipType',0);

  return useAxios({
    baseURL: 'https://adservice.kugou.com',
    url: '/v3/pc_diantai',
    data: mapToObject(dataMap),
    method: 'post',
    encryptType: 'android',
  })

}

export default useModule;