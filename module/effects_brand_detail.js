// 音效 - 耳机详情

module.exports = (params, useAxios) => {
  const paramsMap = {
    brand_id: params.brand_id || 0,
    pagesize: params.pagesize || 30,
    page: params.page || 1,
  };

  return useAxios({
    baseURL: 'http://mobilecdngz.kugou.com',
    url: '/api/v5/earphone/get_model',
    method: 'GET',
    params: paramsMap,
    encryptType: 'android',
    clearDefaultParams: true,
    cookie: params?.cookie || {},
  });
};
