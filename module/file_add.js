
const {  signParamsKey,appid, mid ,clientver,clienttime,rsaEncrypt2, cryptoAesEncrypt } = require('../util'); 

module.exports = (params, useAxios) => {
  const userid = params?.token || params.cookie?.token || '0';
  const token = params?.token || params.cookie?.token || '';
  const paramsmap =  {
      filename: params.fileHash || '',
    };
    
    const aesEncrypt = cryptoAesEncrypt(paramsmap);
    
    const p = rsaEncrypt2({ aes: aesEncrypt.key, uid: userid, token }).toUpperCase();
    
    const dataMap = {
      clienttime,
      mid,
      key: signParamsKey(clienttime.toString(), appid),
      clientver,
      appid,
      p
    }

return useAxios({
    baseURL:'https://mcloudservice.kugou.com',
    url: '/v1/add_files',
    encryptType: 'android',
    method: 'POST',
    data: dataMap,
    cookie: params?.cookie,
  });

}