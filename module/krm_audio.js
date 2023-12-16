const { appid, clientver } = require('../util');
// 根据 album_audio_id/MixSongID 获取歌曲 相对应的 歌手/专辑/歌曲信息
module.exports = (params, useAxios) => {
  const resource = (params?.album_audio_id || '').split(',').map((s) => ({ entity_id: Number(s) }));

  const paramsMap = {
    data: encodeURIComponent(JSON.stringify(resource)),
    fields: params.fields || 'base',
    appid,
    clientver,
    show_privilege: 1,
  };

  return useAxios({
    baseURL: 'http://openapicdnretry.kugou.com',
    url: '/kmr/v3/audio',
    method: 'GET',
    params: paramsMap,
    encryptType: 'android',
    cookie: params?.cookie || {},
    clearDefaultParams: true,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};
