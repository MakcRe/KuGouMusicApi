export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  return useAxios({
    baseURL: 'https://login-user.kugou.com',
    url: '/v1/qrcode',
    method: 'GET',
    params: { appid: params?.type === 'web' ? 1014 : 1001, type: 1 },
    encryptType: 'web',
    cookie: params?.cookie || {},
  });
}

export default useModule;