// 听书分类标签列表
// 酷狗听书「分类」标签树（有声小说 906 及其 24 个子分类），走标准版
// gateway.kugou.com/v3/list_audiobook_tags（x-router: longaudio.kugou.com，
// appid=1005 + 标准签名盐）。
// 响应 data[0] 为有声小说(906)，其 son[] 为子分类（tag_id/tag_name/channel/show_vip），
// channel：0=通用 / 1=男频 / 2=女频。
module.exports = (params, useAxios) => {
  return useAxios({
    url: '/v3/list_audiobook_tags',
    method: 'get',
    params: {
      platform: 'android',
      clientver: 20789, // 覆盖为与官方 Android 客户端一致
    },
    encryptType: 'android',
    headers: { 'x-router': 'longaudio.kugou.com' },
    cookie: params?.cookie || {},
  });
};
