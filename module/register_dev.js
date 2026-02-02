module.exports = (params, useAxios) => {
  const cookie = params?.cookie || {};
  const shouldRequest = !(params && Object.prototype.hasOwnProperty.call(params, 'register'));
  const dataMap = {
    mid: params?.mid  || cookie?.KUGOU_API_MID || '',
    uuid: params?.uuid || '-',
    appid: '1014',
    userid: params?.userid || '0',
  };

  if (!shouldRequest) {
    return Promise.resolve({
      status: 200,
      body: {
        status: 1,
        data: {
          mid: cookie?.KUGOU_API_MID,
          guid: cookie?.KUGOU_API_GUID,
          serverDev: cookie?.KUGOU_API_DEV,
          mac: cookie?.KUGOU_API_MAC,
        },
      },
      cookie: [],
      headers: {},
    });
  }

  return new Promise((resolve, reject) => {
    useAxios({
      baseURL: 'https://userservice.kugou.com',
      url: '/risk/v1/r_register_dev',
      method: 'POST',
      data: Buffer.from(JSON.stringify(dataMap)).toString('base64'),
      params: { ...dataMap, 'p.token': '', platid: 4 },
      encryptType: 'register',
      cookie,
    })
      .then((res) => {
        const { body } = res;
        if (body?.status === 1 && body?.data) {
          res.cookie.push(`dfid=${res.body.data['dfid']}`);
        }
        res.body.data = {
          ...(res.body.data || {}),
          mid: cookie?.KUGOU_API_MID,
          guid: cookie?.KUGOU_API_GUID,
          serverDev: cookie?.KUGOU_API_DEV,
          mac: cookie?.KUGOU_API_MAC,
        };
        resolve(res);
      })
      .catch((e) => reject(e));
  });
};
