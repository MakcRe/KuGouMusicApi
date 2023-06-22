// 开放平台登录
import axios from 'axios';
import { wx_appid, wx_secret } from '../util/config.json';
import { cryptoAesDecrypt, cryptoAesEncrypt, cryptoRSAEncrypt } from '../util/crypto';
import { mapToObject } from '../util/util';

const assetsToken = (code: string) => {
  return axios({
    url: 'https://api.weixin.qq.com/sns/oauth2/access_token',
    method: 'POST',
    params: { secret: wx_secret, appid: wx_appid, code, grant_type: 'authorization_code' },
  })
}
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const answer: UseAxiosResponse = { status: 500, body: {}, cookie: [] };
  return new Promise(async (resolve, reject) => {
    try {
      const assetsTokenResp = await assetsToken(params?.code || '');

      if (assetsTokenResp.data?.access_token && assetsTokenResp.data?.openid) {
        const dateNow = Date.now();

        const encrypt = cryptoAesEncrypt({ access_token: assetsTokenResp.data.access_token });
        const pk = cryptoRSAEncrypt({ 'clienttime_ms': dateNow, key: encrypt.key }).toUpperCase()

        const dataMap = new Map();

        dataMap.set('force_login', 1);
        dataMap.set('partnerid', 36);
        dataMap.set('clienttime_ms', dateNow);
        dataMap.set('t1', 0);
        dataMap.set('t2', 0);
        dataMap.set('t3', 'MCwwLDAsMCwwLDAsMCwwLDA=');
        dataMap.set('plat', 1);
        dataMap.set('openid', assetsTokenResp.data.openid);
        dataMap.set('params', encrypt.str);
        dataMap.set('pk', pk);

        const response = await useAxios({
          url: '/v6/login_by_openplat',
          method: 'POST',
          data: mapToObject(dataMap),
          cookie: params?.cookie,
          encryptType: 'android',
          headers: { 'x-router': 'login.user.kugou.com' },
        });

        if (response.body?.status === 1) {
          const getToken = cryptoAesDecrypt(response.body.data?.secu_params, encrypt.key);
          if (typeof getToken === 'object') {
            response.body.data = { ...response.body.data, ...getToken };
            Object.keys(getToken).forEach((key) => response.cookie.push(`${key}=${getToken[key]}`));
          } else {
            response.body.data['token'] = getToken;
            response.cookie.push(`token=${getToken}`);
          }
          response.cookie.push(`userid=${response.body.data?.userid || 0}`)
        }
        resolve(response);

      } else  {
        answer.status = 502;
        answer.body = { status: 0, msg: assetsTokenResp.data };
        reject(answer);
      }

    } catch (error) {
      answer.status = 502;
      answer.body = { status: 0, msg: error };
      reject(answer);
    }
  })
}

export default useModule;