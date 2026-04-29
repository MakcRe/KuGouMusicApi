
const { appid ,clientver, cryptoAesEncrypt } = require('../util');

module.exports = (params, useAxios) => {
  const encrypt = cryptoAesEncrypt( params?.token || params.cookie?.token || '');
  const paramsmap = {
    version: clientver,
    userid: params?.userid || params.cookie?.userid || '0',
    filename: params.fileHash || '',
    token: encrypt,
    appid,
    method: "POST",
    bucket: "musiccloud",
    }

  return useAxios({
    baseURL: 'http://bssblbig.kugou.com',
    url: '/v2/authorization',
    encryptType: 'android',
    method: 'GET',
    params: paramsmap,
    cookie: params?.cookie,
  });


},

module.exports = (params, useAxios) => {
  const datamap = {
    version: clientver,
    extendname: "wav",
    userid: params?.userid || params.cookie?.userid || '0',
    filename: params.fileHash || '',
    appid,
    bucket: "musiccloud",
    }

  return useAxios({
    baseURL: 'http://bssblbig.kugou.com',
    url: '/mutipart/initiate/music',
    encryptType: 'android',
    method: 'POST',
    data: datamap,
    cookie: params?.cookie,
  });


}