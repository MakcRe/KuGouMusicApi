import { mapToObject } from "../util/util";
import { cryptoMd5 } from "../util/crypto";

// 专辑详情
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dateTime = Date.now();
  const data = (params?.hash || '').split(',').map(s => ({ hash: s, audio_id: 0 }));
  const dfid = params?.cookie?.dfid || params?.dfid || '-';
  const userid = params?.cookie?.userid || params?.userid || 0;
  const token = params?.cookie?.token || params?.token || 0;

  const dataMap = new Map();
  dataMap.set('appid', 1005);
  dataMap.set('clienttime', dateTime);
  dataMap.set('clientver', 11309);
  dataMap.set('data', data);
  dataMap.set('dfid', dfid);
  dataMap.set('key', cryptoMd5(dateTime.toString()));
  dataMap.set('mid', cryptoMd5(dfid))

  token && dataMap.set('token', token);
  userid && dataMap.set('userid', userid);


  return useAxios({
    baseURL: 'http://kmr.service.kugou.com',
      url: '/v1/audio/audio',
    method: 'POST',
    data: mapToObject(dataMap),
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: { 'x-router': 'kmr.service.kugou.com', 'Content-Type': 'application/json' },
  });
}

export default useModule;