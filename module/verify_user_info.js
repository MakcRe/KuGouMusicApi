const { cryptoAesEncrypt, rsaEncrypt2 } = require('../util');
// 验证验证码数据
module.exports = (params, useAxios) => {
  const clienttime = Date.now();
  // const encrypt = cryptoAesEncrypt(JSON.stringify({}));
  const dataMap = {
    eventid: params?.eventid,
    userid: params?.userid || 0,
    platid: params?.platid || 2,
    v_type: params?.v_type || 23,
    verifycode: decodeURIComponent(params?.verifycode || ''),
    wasm: 1,
    i: '',
    sid: decodeURIComponent(params?.sid || ''),
    edt: decodeURIComponent(params?.edt || ''),
    // pk: rsaEncrypt2({ clienttime, key: encrypt.key }),
    // params: encrypt.str,
  };

  return useAxios({
    baseURL: 'https://verifyservice.kugou.com',
    url: '/v4/verify_user_info',
    encryptType: 'android',
    method: 'POST',
    data: dataMap,
    params: { clientver: 11510 },
    cookie: params?.cookie || {},
  });
};
