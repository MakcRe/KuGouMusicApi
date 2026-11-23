/**
 * 发现页单卡片推荐（按卡片 ID 直连对应子接口）
 *
 * 单曲类卡片（3001/3004/3005/3006/3007/3014/3032/3101/3102）走：
 *   POST https://gateway.kugou.com/youth/v1/song/single_card_recommend
 * 3103/3104/3105/3106/3107 则由 buildCardSubRequest 分发到各自的子接口
 * （tag_card_recommend / get_featured_channel / longaudio_recommend /
 *  lab_feature_list / concepts ai recommend_song），也可使用各自专用路由。
 *
 * 卡片 ID 与实测标题（card_info.card_title 由服务端下发）：
 *   3001 私人专属好歌（pagesize=30）        3004 小众宝藏佳作（pagesize=10）
 *   3005 潮流尝鲜（pagesize=30）            3006 VIP专属推荐（pagesize=10）
 *   3007 喜欢这首歌的TA也喜欢（需 source_mixsong）
 *   3014/3032 喜欢这首歌的TA也喜欢（服务端自选最近播放歌曲）
 *   3101 概念er新推（pagesize=30）          3102 喜欢「xx」的TA也喜欢（标签动态标题）
 *
 * 响应结构（status=1 时）：歌曲类卡片返回
 *   { status: 1, error_code: 0, data: {
 *       card_info: { card_id, card_title, card_desc?, display_style?, song_name?, ... },
 *       song_list: [ <歌曲实体，mixsongid/audio_info(hash)/album_info/...> ],
 *       song_count?: number } }
 * 3103 返回 data.tag_list；3104/3105/3106/3107 返回各自 data.list。
 *
 * @param {Object} params
 * @param {number} params.card_id - 卡片 ID（全部 14 张：3001/3004/3005/3006/3007/3014/3032/
 *   3101-3107）。3103/3104/3105/3106/3107 亦可用各自专用路由
 * @param {number} [params.pagesize] - 返回歌曲数（默认按客户端映射：3004/3006=10，其余=30；
 *   3107 默认 6）
 * @param {string} [params.source_mixsong] - 来源歌曲标识（3007 卡需要，服务端用最近播放生成推荐）
 * @param {string} [params.tagid] - 标签 ID（3102/3103 可指定标签）
 * @param {string} [params.u_info] - 客户端附加信息串（实测可空）
 * @param {number} [params.page] - 3107 AI 免费听页码，默认 1
 * @param {string} [params.bi_index] - 3104 频道推荐曝光索引，默认 '0'
 * @param {string} [params.label] - 3104 频道推荐标签过滤，默认空
 * @param {Array<Object>|string} [params.album_playlist] - 3105 长音频的本地专辑播放历史
 * @param {Object} params.cookie - 登录态（token/userid）
 * @returns {Promise<{status: number, body: Object}>}
 */
const { discoveryCards } = require('../util');

module.exports = (params, useAxios) => {
  const cardId = parseInt(params?.card_id, 10);
  const { CONCEPT_CLIENTVER, CARD_MODULES, buildCardSubRequest, splitSubUrl } = discoveryCards;
  if (!CARD_MODULES[cardId]) {
    return Promise.reject({
      status: 502,
      body: { status: 0, error_code: 1, error: `card_id 无效：${params?.card_id}（支持 3001/3004/3005/3006/3007/3014/3032/3101-3107）` },
    });
  }

  const clienttime = Math.floor(Date.now() / 1000);

  const cred = {
    dfid: params?.cookie?.dfid || '-',
    mid: params?.cookie?.KUGOU_API_MID || params?.cookie?.mid || '',
    token: params?.cookie?.token || '',
    userid: params?.cookie?.userid || 0,
  };

  const sub = buildCardSubRequest(cardId, {
    cred,
    clienttime,
    source_mixsong: params?.source_mixsong || '',
    tagid: params?.tagid || '',
    u_info: params?.u_info || '',
    pagesize: params?.pagesize,
    page: params?.page,
    bi_index: params?.bi_index != null ? String(params.bi_index) : undefined,
    label: params?.label || '',
    album_playlist: params?.album_playlist,
  });

  // 子请求 URL 自带完整 query 与 signature；顶层直连时沿用同一签名
  const { path, params: topParams } = splitSubUrl(sub);

  return useAxios({
    url: path,
    method: sub.method,
    data: sub.body || undefined,
    params: topParams,
    clearDefaultParams: true, // query/签名已按子请求构造完成
    cookie: params?.cookie || {},
    headers: {
      'User-Agent': `Android16-1070-${CONCEPT_CLIENTVER}-130-0-DiscoveryCard-wifi`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};
