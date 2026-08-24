// 音效 - 汽车列表

module.exports = (params, useAxios) => {

  const paramsMap = 
  {
    plat: 2,
    version: 12460,
    apiver: 2,
    sort: 1,
    pagesize: params.pagesize || 30,
    page: params.page || 1,
    classify: 5,
    rel_id: params.rel_id || 0,
  }
  
  return useAxios({
    baseURL: 'http://mobilecdngz.kugou.com',
    url: '/api/v3/sound/list',
    method: 'GET',
    params: paramsMap,
    encryptType: 'android',
    clearDefaultParams: true,
    cookie: params?.cookie || {},
  });
};
