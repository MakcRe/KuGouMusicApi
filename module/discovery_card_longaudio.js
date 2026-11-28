/**
 * 发现页长音频推荐（longaudio_recommend）
 *
 * 对应酷狗概念版发现页长音频卡片（card_id=3105，module=y_longaudio），接口：
 *   POST https://gateway.kugou.com/youth/v1/song/longaudio_recommend
 *
 * 注意：客户端该卡片受 AB 配置门控（DiscoveryCardInfo 中仅在配置开启时加入卡片列表）。
 * query 带 card_id=3105/module_id=1；请求体为 {"album_playlist":[...]}（客户端 aj.a.a(null)
 * 生成的本地专辑播放历史，无记录时为空数组）。
 *
 * 响应结构（status=1 时；card_info 不保证下发，实测匿名常见为 list/album_count）：
 *   { status: 1, error_code: 0, data: {
 *       card_info?: { card_id: 3105, card_title: ... },
 *       list: [ <长音频专辑实体 LongAudioAlbum> ],
 *       album_count?: number,
 *       bi_index?: number } }
 *
 * @param {Object} params
 * @param {Array<Object>|string} [params.album_playlist] - 本地专辑播放历史（数组或 JSON 字符串，
 *   默认空数组）。每项形如 {ID, A, F, C, T, TT}，A=2（追更节目）时另有 PP/SP/AP/PT
 * @param {Object} params.cookie - 登录态（token/userid）
 * @returns {Promise<{status: number, body: Object}>}
 */
const { discoveryCards } = require('../util');

module.exports = (params, useAxios) => {
  const { CONCEPT_CLIENTVER, buildCardSubRequest, splitSubUrl } = discoveryCards;
  const clienttime = Math.floor(Date.now() / 1000);

  const cred = {
    dfid: params?.cookie?.dfid || '-',
    mid: params?.cookie?.KUGOU_API_MID || params?.cookie?.mid || '',
    token: params?.cookie?.token || '',
    userid: params?.cookie?.userid || 0,
  };

  const sub = buildCardSubRequest(3105, { cred, clienttime, album_playlist: params?.album_playlist || [] });

  // 请求体 {"album_playlist":[...]}（参与子请求签名，以 buildCardSubRequest 生成为准）
  const data = JSON.parse(sub.body || '{}');
  const { path, params: topParams } = splitSubUrl(sub);

  return useAxios({
    url: path,
    method: 'POST',
    data,
    params: topParams,
    clearDefaultParams: true,
    cookie: params?.cookie || {},
    headers: {
      'User-Agent': `Android16-1070-${CONCEPT_CLIENTVER}-130-0-DiscoveryCard-wifi`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};
