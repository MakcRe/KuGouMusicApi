module.exports = (params, useAxios) => {
  return useAxios({
    url: '/scene/v1/scene/module',
    params: { scene_id: params.id },
    method: 'GET',
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
};
