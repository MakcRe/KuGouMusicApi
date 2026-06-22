
const { appid, mid ,clientver,signParamsKey, cryptoAesEncrypt } = require('../util');


module.exports = (params, useAxios) => {
  const clienttime = Math.floor(Date.now() / 1000);
  const encrypt = cryptoAesEncrypt( params?.token || params.cookie?.token || '');
  const paramsmap = {
      method: "POST",
      filename: params.fileHash || '',
      extranet: "1",
      bucket: "musicclound",
      signatrue: signParamsKey(clienttime.toString(), appid),
      clientver,
      dfid:  params?.dfid || params.cookie?.dfid || '',
      clienttime,
      token: encrypt,
      loginType: "1",
      userid:  params?.userid || params.cookie?.userid || '0',
      version: clientver,
      appid,
      mid,
      buVerifyCode:"0"
    }

  return useAxios({
    url: '/v1/upload/auth',
    encryptType: 'android',
    method: 'GET',
    params: paramsmap,
    cookie: params?.cookie,
    headers: { 'x-router': 'bsstrackercdngz.kugou.com' }
  });

}