// 手机登录
const { cryptoAesDecrypt, cryptoAesEncrypt, cryptoRSAEncrypt, signParamsKey, isLite, randomString } = require('../util');

module.exports = (params, useAxios) => {
  const dateTime = Date.now();
  const encrypt = cryptoAesEncrypt({ mobile: params?.mobile || '', code: params?.code || '' });
  const mobile = params?.mobile && `${params.mobile.toString().substring(0, 2)}*****${params.mobile.toString().substring(10, 11)}`;
  const dfid = params?.cookie?.dfid ?? randomString(24);
  let dataMap = {
    plat: 1,
    support_multi: 1,
    t1: '562a6f12a6e803453647d16a08f5f0c2ff7eee692cba2ab74cc4c8ab47fc467561a7c6b586ce7dc46a63613b246737c03a1dc8f8d162d8ce1d2c71893d19f1d4b797685a4c6d3d81341cbde65e488c4829a9b4d42ef2df470eb102979fa5adcdd9b4eecfea8b909ff7599abeb49867640f10c3c70fc444effca9d15db44a9a6c907731e2bb0f22cd9b3536380169995693e5f0e2424e3378097d3813186e3fe96bbe7023808a0981b4e2b6135a76faac',
    t2: '31c4daf4cf480169ccea1cb7d4a209295865a9d2b788510301694db229b87807469ea0d41b4d4b9173c2151da7294aeebfc9738df154bbdf11a4e117bb5dff6a3af8ce5ce333e681c1f29a44038f27567d58992eb81283e080778ac77db1400fdf49b7cf7e26be2e5af4da7830cc3be4',
    clienttime_ms: dateTime,
    mobile,
    key: signParamsKey(dateTime),
    pk: cryptoRSAEncrypt({ 'clienttime_ms': dateTime, key: encrypt.key }).toUpperCase(),
    params: encrypt.str,
  };

  if (params?.userid) dataMap['userid'] = params.userid;

  if (isLite) {
    dataMap['dfid'] = dfid;
    dataMap['dev'] = params.cookie?.KUGOU_API_DEV;
    dataMap['gitversion'] = '5f0b7c4';
  } else {
    dataMap['t3'] = 'MCwwLDAsMCwwLDAsMCwwLDA=';
  }

  return new Promise((resolve, reject) => {
    useAxios({
      baseURL: 'https://loginserviceretry.kugou.com',
      url: `/v7/login_by_verifycode`,
      method: 'POST',
      data: dataMap,
      encryptType: 'android',
      headers: {
        'support-calm': '1',
        'User-Agent': 'Android16-1070-11440-130-0-LOGIN-wifi',
      },
      cookie: params?.cookie || {},
    })
      .then((res) => {
        const { body } = res;
        if (body?.status && body?.status === 1) {
          if (body?.data?.secu_params) {
            const getToken = cryptoAesDecrypt(body.data.secu_params, encrypt.key);
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
