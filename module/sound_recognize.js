
const { appid, clientver, uuid } = require('../util');

module.exports = (params, useAxios) => {
  const userid = params?.userid || params?.cookie?.userid || 0;
  const mid = params?.cookie?.KUGOU_API_MID;
  const token = params?.token || params?.cookie?.token || '';
  const clienttime = Date.now();
  
  const dataMap = {
    multi_result: 1,
    request_type: 1,
    area_code: 1,
    mid,
    fptype: 2,
    userid,
    uuid,
    token,
    dfid:  params?.dfid || params?.cookie?.dfid || '',
    fpid: '2813539856812922955',
    appid,
    include_unpublish: 1,
    clientver,
    clienttime,
    gitversion: 'cfe060d',
    fpindex: 3
  };

  return useAxios({
    baseURL:'http://fingerprint.service.kugou.com',
    url: '/v3/music_trackid_second',
    data: dataMap,
    method: 'POST',
    encryptType: 'android',
    cookie: params?.cookie
  });
};
