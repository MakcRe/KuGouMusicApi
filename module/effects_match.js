// 音效 - 通用耳机音效

module.exports = (params, useAxios) => {
  const paramsMap = {
    plat: 2,
    version: 12460
  }

  return useAxios({
    baseURL: 'http://mobilecdngz.kugou.com',
    url: '/api/v5/earphone/match',
    method: 'GET',
    params: paramsMap,
    encryptType: 'android',
    clearDefaultParams: true,
    cookie: params?.cookie || {},
    
  });
};
