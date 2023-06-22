import { mapToObject } from '../util/util';
import { cryptoAesDecrypt, cryptoAesEncrypt, cryptoRSAEncrypt } from '../util/crypto';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dateNow = Date.now();
  const encrypt = cryptoAesEncrypt({ pwd: params?.password || '', code: '' ,  clienttime_ms: dateNow});
  const dataMap = new Map();
  dataMap.set('plat', 1);
  dataMap.set('support_multi', 1);
  dataMap.set('clienttime_ms', dateNow);
  dataMap.set('t1', 0);
  dataMap.set('t2', 0);
  dataMap.set('t3', 'MCwwLDAsMCwwLDAsMCwwLDA=');
  dataMap.set('username', params?.username);
  dataMap.set('params', encrypt.str);
  dataMap.set('pk', cryptoRSAEncrypt({'clienttime_ms': dataMap.get('clienttime_ms'), key: encrypt.key}).toUpperCase());

  return new Promise((resolve, reject) => {
    useAxios({
      url: '/v9/login_by_pwd',
      method: 'POST',
      data: mapToObject(dataMap),
      encryptType: 'android',
      cookie: params?.cookie || {},
      headers: { 'x-router': 'login.user.kugou.com' },
    }).then(res => {
      const { body } = res;
      if (body?.status && body?.status === 1) {
        if (body?.data?.secu_params) {
          const getToken = cryptoAesDecrypt(body.data.secu_params, encrypt.key);
          if (typeof getToken === 'object') {
            res.body.data = { ...body.data, ...getToken};
            Object.keys(getToken).forEach(key => res.cookie.push(`${key}=${getToken[key]}`));
          } else {
            res.body.data['token'] = getToken;
            res.cookie.push(`token=${getToken}`);
          }
          res.cookie.push(`userid=${res.body.data?.userid || 0}`)

          resolve(res);
          return;
        }
      }
      resolve(res);
    }).catch(e => reject(e));
  });
}

export default useModule;