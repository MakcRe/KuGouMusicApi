// 获取歌曲信息
const { appid, clientver } = require('../util');

module.exports = (params, useAxios) => {
  const resource = (params?.hash || '').split(',').map((s) => ({ type: 'audio', page_id: 0, hash: s }));
  const dataMap = {
    appid,
    area_code: 1,
    behavior: 'play',
    clientver,
    need_hash_offset: 1,
    relate: 1,
    support_verify: 1,
    resource,
  };

  return useAxios({
    url: '/v2/get_res_privilege/lite',
    data: dataMap,
    method: 'post',
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: { 'x-router': 'media.store.kugou.com', 'Content-Type': 'application/json' },
  });
};
