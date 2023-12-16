module.exports = (params, useAxios) => {
  return useAxios({
    url: '/scene/v1/scene/list_v2',
    params: { scene_id: params.id, page: params.page || 1, pagesize: params.pagesize || 30 },
    data: { exposure: [] },
    method: 'POST',
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
};
