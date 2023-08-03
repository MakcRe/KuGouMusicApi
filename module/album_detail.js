// 专辑详情
module.exports =  (params, useAxios) => {
  const data = { data: [{ album_id: params.id }], is_buy: params?.is_buy || 0 };
  return useAxios({
    url: '/kmr/v2/albums',
    method: 'POST',
    data,
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: { 'x-router': 'openapi.kugou.com', 'kg-tid': '255' },
  });
}
