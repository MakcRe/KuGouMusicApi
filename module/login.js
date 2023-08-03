const { cryptoAesDecrypt, cryptoAesEncrypt, cryptoRSAEncrypt } = require('../util');

module.exports = (params, useAxios) => {
  const dateNow = Date.now();
  const encrypt = cryptoAesEncrypt({ pwd: params?.password || '', code: '' ,  clienttime_ms: dateNow});
  const dataMap = {
    plat: 1,
    support_multi: 1,
    clienttime_ms: dateNow,
    t1: 0,
    t2: 0,
    t3: 'MCwwLDAsMCwwLDAsMCwwLDA=',
    username: params?.username,
    params: encrypt.str,
    pk: cryptoRSAEncrypt({'clienttime_ms': dateNow, key: encrypt.key}).toUpperCase()
  };

  return new Promise((resolve, reject) => {
    useAxios({
      url: '/v9/login_by_pwd',
      method: 'POST',
      data: dataMap,
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
          res.cookie.push(`vip_type=${res.body.data?.vip_type || 0}`)
          res.cookie.push(`vip_token=${res.body.data?.vip_token || ''}`)

          resolve(res);
          return;
        }
      }
      resolve(res);
    }).catch(e => reject(e));
  });
}
