// 音效 - 耳机列表

module.exports = (params, useAxios) => {
  const paramsMap = {
    sort: 1,
    pagesize: params.pagesize || 30,
    page: params.page || 1,
  };

  return useAxios({
    baseURL: 'http://mobilecdngz.kugou.com',
    url: '/api/v5/earphone/get_brand',
    method: 'GET',
    params: paramsMap,
    encryptType: 'android',
    clearDefaultParams: true,
    cookie: params?.cookie || {},
  });
};
