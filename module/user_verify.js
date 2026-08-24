module.exports = (params, useAxios) => {
  return new Promise((resolve, reject) => {
    useAxios({
      baseURL: 'http://trackercdngz.kugou.com',
      url: '/v1/user_verify',
      method: 'GET',
      params: { module_id: 51 },
      encryptType: 'android',
      cookie: Object.assign({}, params?.cookie),
    })
      .then((res) => {
        const body = res.body;
        if (body?.status === 1 && body?.data && body?.data?.auth) {
          res.cookie.push(`auth=${body?.data?.auth}`);
        }

        resolve(res);
      })
      .catch(reject);
  });
};
