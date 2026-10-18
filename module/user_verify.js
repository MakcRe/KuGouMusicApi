module.exports = (params, useAxios) => {
  return new Promise((resolve, reject) => {
    useAxios({
      baseURL: 'http://gateway.kugou.com',
      url: '/v1/user_verify',
      method: 'GET',
      params: { module_id: 51 },
      encryptType: 'android',
      // 与官方 Android 客户端抓包一致：请求统一发往 gateway.kugou.com，目标服务由
      // x-router 指定。直连后端域名会绕过网关（签名校验、CDN 调度、风控都在网关侧），
      // 且 Host 同时承担「连哪台机器」和「要哪个服务」两重语义，与客户端行为不符。
      headers: { 'x-router': 'trackercdngz.kugou.com' },
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
