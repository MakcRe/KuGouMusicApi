// 获取歌单所有歌曲
module.exports = (params, useAxios) => {
  const paramsMap = {
    plat: 1,
    type: 1,
    module: 'NONE',
    page: params?.page || 1,
    pagesize: params?.pagesize || 30,
    global_collection_id: params?.id,
  };

  return useAxios({
    baseURL: 'https://pubsongscdn.kugou.com',
    url: '/v2/get_other_list_file',
    method: 'GET',
    encryptType: 'android',
    params: paramsMap,
    cookie: params?.cookie || {},
    headers: { 'x-router': 'pubsongscdn.kugou.com' },
  });
};
