// 获取今日推荐信息，有可能为空
module.exports = (params, useAxios) => {
  const dataMap = {
    ip: params?.id,
    page: params?.page || 1,
    pagesize: params?.pagesize || 30
  };


  return useAxios({
    url: '/ocean/v6/pubsongs/list_info_for_ip',
    encryptType: 'android',
    method: 'POST',
    params: dataMap,
    cookie: params?.cookie || {},
  });

};