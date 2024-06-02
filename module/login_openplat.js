// 开放平台登录
const axios = require('axios');
const {
  wx_appid,
  wx_secret,
  cryptoAesDecrypt,
  cryptoAesEncrypt,
  cryptoRSAEncrypt,
  wx_lite_appid,
  wx_lite_secret,
  isLite,
} = require('../util');
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
          force_login: 1,
          partnerid: 36,
          clienttime_ms: dateNow,
          t1: 0,
          t2: 0,
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
