const { cryptoAesEncrypt, cryptoRSAEncrypt } = require('../util');
module.exports = (params, useAxios) => {
  const token = params?.token || params?.cookie?.token || '';
  const userid = params?.userid || params?.cookie?.userid || '';
  const clienttime_ms = Date.now();
  const encrypt = cryptoAesEncrypt({ token, userid });
  const pk = cryptoRSAEncrypt({ clienttime_ms, key: encrypt.key }).toUpperCase();

  const dataMap = {
    ext: 0,
    visit_time: 0,
    plat: 1,
    pk: pk,
    params: encrypt.str,
    userid,
    clienttime_ms: clienttime_ms,
  };


  return useAxios({
    url: '/v2/get_login_extend_info',
    method: 'POST',
    data: dataMap,
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: {'x-router': 'userinfoservice.kugou.com'}
  });
};
