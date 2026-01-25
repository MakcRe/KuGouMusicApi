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
    t1: '562a6f12a6e803453647d16a08f5f0c2ff7eee692cba2ab74cc4c8ab47fc467561a7c6b586ce7dc46a63613b246737c03a1dc8f8d162d8ce1d2c71893d19f1d4b797685a4c6d3d81341cbde65e488c4829a9b4d42ef2df470eb102979fa5adcdd9b4eecfea8b909ff7599abeb49867640f10c3c70fc444effca9d15db44a9a6c907731e2bb0f22cd9b3536380169995693e5f0e2424e3378097d3813186e3fe96bbe7023808a0981b4e2b6135a76faac',
    t2: '31c4daf4cf480169ccea1cb7d4a209295865a9d2b788510301694db229b87807469ea0d41b4d4b9173c2151da7294aeebfc9738df154bbdf11a4e117bb5dff6a3af8ce5ce333e681c1f29a44038f27567d58992eb81283e080778ac77db1400fdf49b7cf7e26be2e5af4da7830cc3be4',
    t3: 'MCwwLDAsMCwwLDAsMCwwLDA=',
    pk,
    params: encryptParams.str,
    userid,
    clienttime_ms: dateNow,
  };

  if (isLite) {
    dataMap['dev'] = params.cookie?.KUGOU_API_DEV;
  }

  return new Promise((resolve, reject) => {
    useAxios({
      baseURL: 'http://login.user.kugou.com',
      url: `/v5/login_by_token`,
      method: 'POST',
      data: dataMap,
      cookie: params?.cookie,
      encryptType: 'android',
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
