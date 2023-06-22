import { mapToObject } from '../util/util';
import { cryptoAesDecrypt, cryptoAesEncrypt, cryptoRSAEncrypt } from '../util/crypto';

const key = '90b8382a1bb4ccdcf063102053fd75b8';
const iv = 'f063102053fd75b8';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dateNow = Date.now();
  const token = params?.token || params?.cookie?.token || '';
  const userid = params?.userid || params?.cookie?.userid || '0';
  const encrypt = cryptoAesEncrypt({ clienttime: Math.floor(dateNow / 1000),  token }, { key, iv });
  const encryptParams = cryptoAesEncrypt({});
  const pk = cryptoRSAEncrypt({ clienttime_ms: dateNow, key: encryptParams.key });

  const dataMap = new Map();
  dataMap.set('dfid', params?.cookie.dfid || '-');
  dataMap.set('p3', encrypt);
  dataMap.set('plat', '1');
  dataMap.set('t1', 0);
  dataMap.set('t2', 0);
  dataMap.set('t3', 'MCwwLDAsMCwwLDAsMCwwLDA=');
  dataMap.set('pk', pk);
  dataMap.set('params', encryptParams.str);
  dataMap.set('userid', userid);
  dataMap.set('clienttime_ms', dateNow);

  return new Promise((resolve, reject) => {
    useAxios({
      baseURL: 'http://login.user.kugou.com',
      url: '/v5/login_by_token',
      method: 'POST',
      data: mapToObject(dataMap),
      cookie: params?.cookie,
      encryptType: 'android',
      headers: {'x-router': 'login.user.kugou.com'}
    }).then(res => {
      const { body } = res;
      if (body?.status && body?.status === 1) {
        if (body?.data?.secu_params) {
          const getToken = cryptoAesDecrypt(body.data.secu_params, encryptParams.key);
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