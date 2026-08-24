module.exports = (params, useAxios) => {
  const dataMap = {
    apiver: 2,
    source: 2,
    pagesize: params?.pagesize || 30,
    page: params?.page || 1
  };

  return useAxios({
    url: '/concepts/v1/ai/recommend_song',
    data: dataMap,
    method: 'post',
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
};
