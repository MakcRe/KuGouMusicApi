// 专辑详情
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
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

export default useModule;