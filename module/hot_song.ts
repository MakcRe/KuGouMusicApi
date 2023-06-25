// 热门好歌精选
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {

  return useAxios({
    url: '/singlecardrec.service/v1/single_card_recommend',
    encryptType: 'android',
    method: 'POST',
    data: {},
    params: { 'card_id': params?.card_id || 1 },
    cookie: params?.cookie || {},
  })
}

export default useModule;