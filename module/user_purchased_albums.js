// 已购专辑
const { appid, clientver } = require('../util');

module.exports = (params, useAxios) => {
  const dataMap = {
    appid,
    clientver,
    type: 'album',
    vip: params?.cookie?.vip_type || 0,
    token: params?.cookie?.token || '',
    pagesize: params?.pagesize || 30,
    userid: params?.cookie?.userid || 0,
    page: params?.page || 1,
    area_code: '1',
  };

  return useAxios({
    url: '/v1/get_goods',
    method: 'POST',
    data: dataMap,
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: { 'x-router': 'media.store.kugou.com' },
  });
};
