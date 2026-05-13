const { clientver, appid, signParamsKey, cryptoRSAEncrypt } = require('../util');

module.exports = (params, useAxios) => {
  const userid = params?.userid || params?.cookie?.userid || 0;
  const token = params?.token || params?.cookie.token || ''
  const mid = params?.cookie?.KUGOU_API_MID;
  const clienttime = Math.floor(Date.now() / 1000);
  const p = cryptoRSAEncrypt({ token, clienttime_ms: clienttime }).toUpperCase();

  const datamap = {
    p,
    appid,
    mid,
    clientver,
    clienttime,
    type: '1',
    uuid: '',
    userid,
    key: signParamsKey(clienttime.toString()),
  };

  

  return useAxios({
    baseURL: 'http://userinfo.user.kugou.com',
    url: '/v2/get_grade_info',
    encryptType: 'android',
    method: 'POST',
    data: datamap,
    cookie: params?.cookie,
    // headers: { 'Content-Type': 'text/plain;charset=ISO-8859-1' },
  });
};
