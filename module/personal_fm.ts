import { signParamsKey } from "../util/helper";
import { mapToObject } from "../util/util";

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const userid = params?.cookie?.userid || params?.userid || 0;
  const vip_type = params?.cookie?.vip_type || params?.vipType || 0;
  const dateTime = Date.now();

  const dataMap =  new Map();
  dataMap.set('userid', userid);
  dataMap.set('area_code', 1);
  dataMap.set('playtime', params?.playtime || 0);
  dataMap.set('mode', params?.mode || 'normal');
  dataMap.set('clienttime', dateTime);
  dataMap.set('platform', params?.platform || 'pc');
  dataMap.set('appid', 1005);
  dataMap.set('clientver', 11309);
  dataMap.set('action', params?.action || 'play');
  dataMap.set('key', signParamsKey(dateTime.toString()));
  dataMap.set('song_pool_id', params?.song_pool_id || 0);
  dataMap.set('vip_type', vip_type);
  dataMap.set('mid', '');
  dataMap.set('m_type', 1);
  dataMap.set('is_overplay', params?.is_overplay ? 1 : 0);

  params?.hash && dataMap.set('hash', params.hash);
  params?.songid && dataMap.set('songid', params.songid);

  return useAxios({
    url: '/v2/personal_recommend',
    data: mapToObject(dataMap),
    method: 'post',
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: { 'x-router': 'persnfm.service.kugou.com' },
  })

}

export default useModule;