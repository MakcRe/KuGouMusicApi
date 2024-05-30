// 乐谱详情
module.exports = (params, useAxios) => {
  const paramsMap = {
    srcappid: 2919,
    opern_type: params.opern_type ?? 1,
  }
  return useAxios({
    url: '/miniyueku/v1/opern_square/get_home_hot_opern',
    encryptType: 'web',
    method: 'GET',
    params: paramsMap,
    cookie: params?.cookie || {},
  });
};
