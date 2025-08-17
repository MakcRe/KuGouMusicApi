// 手机登录
const { cryptoAesDecrypt, cryptoAesEncrypt, cryptoRSAEncrypt, signParamsKey, isLite } = require('../util');



module.exports = (params, useAxios) => {
  const dateTime = Date.now();
  const encrypt = cryptoAesEncrypt({ mobile: params?.mobile || '', code: params?.code || '' });
  let dataMap = {
    plat: 1,
    support_multi: 1,
    t1: 0,
    t2: 0,
    clienttime_ms: dateTime,
    mobile: params.mobile,
    key: signParamsKey(dateTime)
  };

  if (params?.userid) dataMap['userid'] = params.userid;

  if (isLite) {
    dataMap['p2'] = cryptoRSAEncrypt({ 'clienttime_ms': dateTime, code: params.code, mobile: params.mobile }).toUpperCase();
  } else {
    const mobile = params?.mobile && `${params.mobile.toString().substring(0, 2)}*****${params.mobile.toString().substring(10, 11)}`;
    dataMap['mobile'] = mobile;
    dataMap['t3'] = 'MCwwLDAsMCwwLDAsMCwwLDA=';
    dataMap['params'] = encrypt.str;
    dataMap['pk'] = cryptoRSAEncrypt({ 'clienttime_ms': dateTime, key: encrypt.key }).toUpperCase()
  }

  return new Promise((resolve, reject) => {
    useAxios({
      url: `/${isLite ? 'v6' : 'v7'}/login_by_verifycode`,
      method: 'POST',
      data: dataMap,
      encryptType: 'android',
      cookie: params?.cookie || {},
      headers: { 'x-router': 'login.user.kugou.com' },
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
