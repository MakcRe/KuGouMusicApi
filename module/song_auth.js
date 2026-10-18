module.exports = (params, useAxios) => {
  const authorization = params.auth || params.cookie.auth || '';

  const dataMap = {
    authorization,
    module_id: 51,
    album_audio_id: Number(params.album_audio_id ?? 0),
    clientver: 11561,
    hash: (params?.hash || '').toLowerCase(),
  };

  return useAxios({
    baseURL: 'http://gateway.kugou.com/',
    url: '/v1/authorization',
    method: 'GET',
    params: dataMap,
    encryptType: 'android',
    // 同 user_verify.js：走网关 + x-router，与官方客户端抓包一致。
    headers: { 'x-router': 'trackercdngz.kugou.com' },
    cookie: Object.assign({}, params?.cookie),
  });
};
