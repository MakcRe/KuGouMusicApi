// 音效 - 汽车列表

module.exports = (params, useAxios) => {
  return useAxios({
    baseURL: 'http://mobilecdngz.kugou.com',
    url: '/api/v5/car_sound/get_brand',
    method: 'GET',
    encryptType: 'android',
    clearDefaultParams: true,
    cookie: params?.cookie || {},
  });
};
