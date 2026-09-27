/**
 * 首页刷歌（发现页沉浸式推荐）
 *
 * 对应酷狗音乐 Android 客户端首页"刷歌"卡片的推荐流，抓包接口：
 *   POST https://papi.kugou.com/homediscoverrec/v1/client/home_discover_rec
 */
module.exports = (params, useAxios) => {
  const userid = params?.userid || params?.cookie?.userid || 0

  // 请求体 go_ky_extra：客户端环境附加信息（key-val 数组，值均为字符串），实测任意取值均不影响可用性
  // 各 key 取值含义（解包源码佐证）：
  //   network    网络类型：0=无网络/未知、1=4G、2=WIFI、3=3G、4=2G、5=5G
  //   play_mode  用户当前播放模式：0/1=顺序播放(列表循环)、2=单曲循环、3=随机播放
  //   no_mv_ret  是否屏蔽 MV 类内容：1=不返回 MV、0=允许返回
  const goKyExtra = params?.go_ky_extra || [
    { key: 'network', val: '2' },
    { key: 'play_mode', val: '2' },
    { key: 'no_mv_ret', val: '1' },
  ]

  const data = {
    support: params?.support || 'only_song', // 支持的内容类型：仅 only_song 有效
    userid,
    recall_type: params?.recall_type || 'song', // 召回类型：	song/mv/album/songlist/radio/anchor
    today_play_num: params?.today_play_num || 0, // 今日已播放歌曲数，影响推荐去重与排序
    pagesize: params?.pagesize || 4, // 每次返回的推荐歌曲数量
    go_ky_extra: goKyExtra,
  }

  return useAxios({
    url: '/homediscoverrec/v1/client/home_discover_rec',
    encryptType: 'android',
    method: 'POST',
    data,
    params: {
      module_key: 'home_discover_rec',
      module_id: 1,
      area_code: 1,
      platform: 'android',
      userid,
      // 客户端版本号：服务端不下发版本低于约 20489 的内容（静默返回空列表），
      // 且必须覆盖概念版 liteClientver=11440，否则 lite 模式下拿不到数据
      clientver: 20809,
    },
    cookie: params?.cookie || {}
  })
}
