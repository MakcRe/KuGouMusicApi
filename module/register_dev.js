// 获取音乐详情
module.exports = (params, useAxios) => {
  const dataMap = {
    mid: params?.mid || '',
    uuid: params?.uuid || '',
    appid: '1014',
    userid: params?.userid || '0',
  };

  return useAxios({
    baseURL: 'https://userservice.kugou.com',
    url: '/risk/v1/r_register_dev',
    method: 'POST',
    data: Buffer.from(JSON.stringify(dataMap)).toString('base64'),
    params: { ...dataMap, 'p.token': '', platid: 4 },
    encryptType: 'register',
    cookie: params?.cookie || {},
  });
};
