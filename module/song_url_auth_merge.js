const { randomString } = require('../util/util');
const songAuth = require('./song_auth');
const songAuthURL = require('./song_url_auth');

// 获取音乐urls
// quality 支持 魔法音乐
// piano 钢琴
// acappella 人声 伴奏 分离
// subwoofer 乐器
// ancient 尤克里里
// dj dj
module.exports = (params, useAxios) => {
  const answer = { status: 500, body: {}, cookie: [] };

  const hash = (params?.hash || '').toLowerCase();
  const album_audio_id = Number(params.album_audio_id ?? 0);

  const cookie = Object.assign({}, { dfid: randomString(24) }, params?.cookie);

  const authorization = params.auth || params.cookie.auth || '';

  return new Promise(async (resolve, reject) => {
    const authData = await songAuth({ hash, album_audio_id, auth: authorization, cookie }, useAxios).catch(reject);

    const { auth, open_time } = authData.body?.data;

    if (!auth && !open_time) reject({ ...answer, body: { error: '获取 auth 和 open_time 失败', status: 0 } });

    songAuthURL({ ...params, auth, open_time, hash, album_audio_id }, useAxios)
      .then(resolve)
      .catch(reject);
  });
};
