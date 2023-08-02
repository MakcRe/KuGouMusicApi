import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const userid = params?.cookie?.userid || params?.userid || 0;
  const token = params?.cookie?.token || params?.token || '';

  const dataMap = new Map();
  dataMap.set('userid', Number(userid));
  dataMap.set('token', token);
  dataMap.set('total_ver', 979);
  dataMap.set('type', 2);
  dataMap.set('page', Number(params?.page || 1));
  dataMap.set('pagesize', Number(params?.pagesize || 30));

  return useAxios({
    url: '/v7/get_all_list',
    encryptType: 'android',
    method: 'post',
    data: mapToObject(dataMap),
    params: { plat: 1, userid: Number(userid), token },
    headers: { 'x-router': 'cloudlist.service.kugou.com' },
  });
};

export default useModule;
