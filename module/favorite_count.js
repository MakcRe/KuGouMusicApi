module.exports = (params, useAxios) => {

  return useAxios({
    baseURL: 'https://gateway.kugou.com',
    url: '/count/v1/audio/mget_collect',
    method: 'GET',
    params: { mixsongids: params.mixsongids },
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
};
