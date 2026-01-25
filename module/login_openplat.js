// 开放平台登录
const axios = require('axios');
const { wx_appid, wx_secret, cryptoAesDecrypt, cryptoAesEncrypt, cryptoRSAEncrypt, wx_lite_appid, wx_lite_secret, isLite } = require('../util');
const appid = isLite ? wx_lite_appid : wx_appid;
const secret = isLite ? wx_lite_secret : wx_secret;

const assetsToken = (code) => {
  return axios({
    url: 'https://api.weixin.qq.com/sns/oauth2/access_token',
    method: 'POST',
    params: { secret, appid, code, grant_type: 'authorization_code' },
  });
};

module.exports = (params, useAxios) => {
  const answer = { status: 500, body: {}, cookie: [] };
  return new Promise(async (resolve, reject) => {
    try {
      const assetsTokenResp = await assetsToken(params?.code || '');

      if (assetsTokenResp.data?.access_token && assetsTokenResp.data?.openid) {
        const dateNow = Date.now();
        const encrypt = cryptoAesEncrypt({ access_token: assetsTokenResp.data.access_token });
        const pk = cryptoRSAEncrypt({ 'clienttime_ms': dateNow, key: encrypt.key }).toUpperCase();

        const dataMap = {
          dev: params.cookie?.KUGOU_API_DEV,
          force_login: 1,
          partnerid: 36,
          clienttime_ms: dateNow,
          t1: '562a6f12a6e803453647d16a08f5f0c2ff7eee692cba2ab74cc4c8ab47fc467561a7c6b586ce7dc46a63613b246737c03a1dc8f8d162d8ce1d2c71893d19f1d4b797685a4c6d3d81341cbde65e488c4829a9b4d42ef2df470eb102979fa5adcdd9b4eecfea8b909ff7599abeb49867640f10c3c70fc444effca9d15db44a9a6c907731e2bb0f22cd9b3536380169995693e5f0e2424e3378097d3813186e3fe96bbe7023808a0981b4e2b6135a76faac',
          t2: '31c4daf4cf480169ccea1cb7d4a209295865a9d2b788510301694db229b87807469ea0d41b4d4b9173c2151da7294aeebfc9738df154bbdf11a4e117bb5dff6a3af8ce5ce333e681c1f29a44038f27567d58992eb81283e080778ac77db1400fdf49b7cf7e26be2e5af4da7830cc3be4',
          t3: 'MCwwLDAsMCwwLDAsMCwwLDA=',
          openid: assetsTokenResp.data.openid,
          params: encrypt.str,
          pk,
        };

        const response = await useAxios({
          url: `/v6/login_by_openplat`,
          method: 'POST',
          data: dataMap,
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
          response.cookie.push(`userid=${response.body.data?.userid || 0}`);
          response.cookie.push(`vip_type=${response.body.data?.vip_type || 0}`);
          response.cookie.push(`vip_token=${response.body.data?.vip_token || ''}`);
        }
        resolve(response);
      } else {
        answer.status = 502;
        answer.body = { status: 0, msg: assetsTokenResp.data };
        reject(answer);
      }
    } catch (error) {
      answer.status = 502;
      answer.body = { status: 0, msg: error };
      reject(answer);
    }
  });
};
