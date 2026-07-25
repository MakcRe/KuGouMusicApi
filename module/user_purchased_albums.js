// 已购专辑
const { appid, clientver } = require('../util');

module.exports = (params, useAxios) => {
  const dataMap = {
    appid,
    userid: Number(params?.cookie?.userid) || 0,
    token: params?.cookie?.token || '',
    page: params?.page || 1,
    pagesize: params?.pagesize || 15,
    clientver: String(clientver),
    deleted: 0,
  };

  return useAxios({
    url: '/openapi/v1/copyright/get_album_goods',
    method: 'POST',
    data: dataMap,
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
};
