// 0 为二维码过期，1 为等待扫码，2 为待确认，4 为授权登录成功（4 状态码下会返回 token）
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  return new Promise((resolve, reject) => {
    useAxios({
      baseURL: 'https://login-user.kugou.com',
      url: '/v1/get_userinfo_qrcode',
      method: 'GET',
      params: { appid: 1005, type: 1, qrcode: params?.key },
      encryptType: 'web',
      cookie: params?.cookie || {},
    }).then(resp => {
      if (resp.body?.data?.status == 4) {
        resp.cookie.push(`token=${resp.body?.data?.token}; PATH=/`);
        resp.cookie.push(`userid=${resp.body?.data?.userid}; PATH=/`);
      }
      resolve(resp);
    }).catch(e => reject(e));
  });
};

export default useModule;