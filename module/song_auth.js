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
    baseURL: 'http://trackercdngz.kugou.com/',
    url: '/v1/authorization',
    method: 'GET',
    params: dataMap,
    encryptType: 'android',
    cookie: Object.assign({}, params?.cookie),
  });
};
