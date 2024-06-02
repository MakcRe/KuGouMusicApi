// 刷新登录
const { cryptoAesDecrypt, cryptoAesEncrypt, cryptoRSAEncrypt, isLite } = require('../util');

const key = '90b8382a1bb4ccdcf063102053fd75b8';
const iv = 'f063102053fd75b8';

const liteKey = 'c24f74ca2820225badc01946dba4fdf7';
const liteIv = 'adc01946dba4fdf7';

module.exports = (params, useAxios) => {
  const dateNow = Date.now();
  const token = params?.token || params?.cookie?.token || '';
  const userid = params?.userid || params?.cookie?.userid || '0';
  const encrypt = cryptoAesEncrypt({ clienttime: Math.floor(dateNow / 1000), token }, { key: isLite ? liteKey : key, iv: isLite ? liteIv : iv });
  const encryptParams = cryptoAesEncrypt({});
  const pk = cryptoRSAEncrypt({ clienttime_ms: dateNow, key: encryptParams.key });


  const dataMap = {
    dfid: params?.cookie?.dfid || '-',
    p3: encrypt,
    plat: 1,
    t1: 0,
    t2: 0,
    t3: 'MCwwLDAsMCwwLDAsMCwwLDA=',
    pk,
    params: encryptParams.str,
    userid,
    clienttime_ms: dateNow,
  };

  return new Promise((resolve, reject) => {
    useAxios({
      baseURL: 'http://login.user.kugou.com',
      url: `/${isLite ? 'v4' : 'v5'}/login_by_token`,
      method: 'POST',
      data: dataMap,
      cookie: params?.cookie,
      encryptType: 'android',
      headers: { 'x-router': 'login.user.kugou.com' },
    })
      .then((res) => {
        const { body } = res;
        if (body?.status && body?.status === 1) {
          if (body?.data?.secu_params) {
            const getToken = cryptoAesDecrypt(body.data.secu_params, encryptParams.key);
            if (typeof getToken === 'object') {
              res.body.data = { ...body.data, ...getToken };
              Object.keys(getToken).forEach((key) => res.cookie.push(`${key}=${getToken[key]}`));
            } else {
              res.body.data['token'] = getToken;
            }
          }
          res.cookie.push(`token=${res.body.data['token']}`);
          res.cookie.push(`userid=${res.body.data?.userid || 0}`);
          res.cookie.push(`vip_type=${res.body.data?.vip_type || 0}`);
          res.cookie.push(`vip_token=${res.body.data?.vip_token || ''}`);
        }
        resolve(res);
      })
      .catch((e) => reject(e));
  });
};
