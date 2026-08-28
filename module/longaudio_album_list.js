// 听书免费书库/分类榜单专辑列表
// 酷狗听书「免费」分类列表（ListenBookCategoryMainFragment），走标准版
// gateway.kugou.com/longaudio/v1/album/list（appid=1005 + 标准签名盐，free=1 免费过滤）。
// - tag_id：分类（906=有声小说全部分类，其余为子分类，如 908=悬疑推理、1097=玄幻异界…）
// - gender：0=不限 / 1=男频 / 2=女频
// - status：0=全部 / 1=连载 / 2=完结
// - sort：0=默认 / 1=播放量 / 2=更新时间
// - 分页：page / page_size；响应 data.data_list[]（专辑），data.is_end=1 表示到底
module.exports = (params, useAxios) => {
  const dataMap = {
    api_ver: 2,
    gender: Math.max(0, parseInt(params?.gender) || 0),
    sort: Math.max(0, parseInt(params?.sort) || 0),
    tag_id: Math.max(0, parseInt(params?.tag_id) || 906),
    free: 1,
    status: Math.max(0, parseInt(params?.status) || 0),
    page: Math.max(1, parseInt(params?.page) || 1),
    page_size: Math.max(1, parseInt(params?.page_size) || 20),
    clientver: 20789, // 覆盖为与官方 Android 客户端一致
  };

  return useAxios({
    url: '/longaudio/v1/album/list',
    method: 'get',
    params: dataMap,
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
};
