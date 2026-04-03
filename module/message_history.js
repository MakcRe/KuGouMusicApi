//列出消息历史
const { cryptoAesEncrypt, appid, mid,signParamsKey,uuid ,dfid,clientver,userid } = require('../util');

module.exports = (params, useAxios) => {
  const encrypt = cryptoAesEncrypt({ token: params.token || params.cookie?.token });
  const dateTime = Date.now();
  const pagesize = params.pagesize;
  const tag = target ? `chat:${target}_${userid}` : undefined;
  const target = params.target;
  const filter = params.filter;
  const dataMap = {
    filter: filter,
    dfid,
    appid,
    pagesize: pagesize,
    mid,
    clientver,
    tag,
    clienttime : dateTime,
    signatrue: signParamsKey(dateTime),
    userid,
    uuid,
    token: encrypt,

  };

return useAxios({
    url: '/v3/msgtag/history',
    encryptType: 'android',
    method: 'GET',
    data: dataMap,
    cookie: params?.cookie,
    headers: { 'x-router': 'msg.mobile.kugou.com' }
  });

}