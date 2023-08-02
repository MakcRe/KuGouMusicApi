import { mapToObject } from "../util/util";

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const resource = (params?.hash || '').split(',').map(s => ({ type: 'audio', page_id: 0, hash: s }))
  const dataMap =  new Map();
  dataMap.set('appid', 1005);
  dataMap.set('area_code', 1);
  dataMap.set('behavior','play');
  dataMap.set('clientver', 11309);
  dataMap.set('need_hash_offset', 1);
  dataMap.set('relate', 1);
  dataMap.set('support_verify', 1);
  dataMap.set('resource', resource);

  return useAxios({
    url: '/v2/get_res_privilege/lite',
    data: mapToObject(dataMap),
    method: 'post',
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: { 'x-router': 'media.store.kugou.com', 'Content-Type': 'application/json' },
  })

}

export default useModule;