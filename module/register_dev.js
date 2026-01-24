module.exports = (params, useAxios) => {
  const dataMap = {
    mid: params?.mid  || params?.cookie?.KUGOU_API_MID || '',
    uuid: params?.uuid || '-',
    appid: '1014',
    userid: params?.userid || '0',
  };

  return new Promise((resolve, reject) => {
    useAxios({
      baseURL: 'https://userservice.kugou.com',
      url: '/risk/v1/r_register_dev',
      method: 'POST',
      data: Buffer.from(JSON.stringify(dataMap)).toString('base64'),
      params: { ...dataMap, 'p.token': '', platid: 4 },
      encryptType: 'register',
      cookie: params?.cookie || {},
    })
      .then((res) => {
        const { body } = res;
        if (body?.status === 1 && body?.data) {
          res.cookie.push(`dfid=${res.body.data['dfid']}`);
        }

        resolve(res);
      })
      .catch((e) => reject(e));
  });
};
