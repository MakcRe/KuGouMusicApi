const { signParamsKey, appid, clientver } = require('../util');
module.exports = (params, useAxios) => {
  const userid = params?.cookie?.userid || params?.userid || 0;
  const vip_type = params?.cookie?.vip_type || params?.vipType || 0;
  const dateTime = Date.now();

  const dataMap = {
    userid,
    area_code: 1,
    playtime: params?.playtime || 0,
    mode: params?.mode || 'normal',
    clienttime: dateTime,
    platform: params?.platform || 'pc',
    appid,
    clientver,
    action: params?.action || 'play',
    key: signParamsKey(dateTime),
    song_pool_id: Number(params?.song_pool_id || 0),
    remain_songcnt: Number(params?.remain_songcnt || 0),
    vip_type,
    mid: '',
    m_type: 1,
    is_overplay: params?.is_overplay ? 1 : 0,
  };

  if (params?.hash) dataMap['hash'] = params.hash;
  if (params?.songid) dataMap['songid'] = params.songid;

  return useAxios({
    url: '/v2/personal_recommend',
    data: dataMap,
    method: 'post',
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: { 'x-router': 'persnfm.service.kugou.com' },
  });
};
