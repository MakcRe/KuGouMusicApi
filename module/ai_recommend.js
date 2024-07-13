const { appid, clientver, signParamsKey, cryptoMd5 } = require('../util');

module.exports = (params, useAxios) => {
  const userid = params?.userid || params?.cookie?.userid || 0;
  const dfid = params?.dfid || params?.cookie?.dfid || '-'; // 自定义
  const mid = cryptoMd5(dfid); // 可以自定义
  const clienttime = Date.now();

  const recommend_source = (params?.album_audio_id || '').split(',').map((s) => ({ ID: Number(s) }));

  const dataMap = {
    platform: 'ios',
    clientver,
    clienttime: clienttime,
    userid,
    client_playlist: [],
    source_type: 2,
    playlist_ver: 2,
    area_code: 1,
    appid,
    key: signParamsKey(clienttime.toString()),
    mid,
    recommend_source,
  };

  return useAxios({
    url: '/recommend',
    data: dataMap,
    method: 'post',
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: { 'x-router': 'songlistairec.kugou.com' },
    clearDefaultParams: true,
  });
};
