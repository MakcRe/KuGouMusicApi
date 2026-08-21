//获取我的详细信息
const {  cryptoRSAEncrypt,appid,clientver,signParamsKey } = require('../util');
module.exports = (params, useAxios) => {
  const token = params?.token || params?.cookie?.token || '';
  const userid = Number(params?.userid || params?.cookie?.userid || '0');
  const clienttime = Date.now();
  const mid = params?.mid || params?.cookie?.mid || params?.cookie?.KUGOU_API_MID || '';
  const p = cryptoRSAEncrypt({ clienttime:clienttime,token:token  }).toUpperCase();

  const dataMap = {
    p,
    appid,
    mid,
    clientver,
    source: 0,
    clienttime,
    uuid: "-",
    userid,
    key: signParamsKey(clienttime),
  };

  return useAxios({
    baseURL: 'http://relation.user.kugou.com',
    url: '/v1/get_my_userinfo',
    method: 'POST',
    data: dataMap,
    cookie: params?.cookie || {},
    headers: { 'Host': 'relation.user.kugou.com' },
  });
};