/**
 * 曲风盲盒·随机心动（tag_card_recommend）
 *
 * 对应酷狗概念版发现页「曲风盲盒·随机心动」卡片（card_id=3103，module=y_style），
 * 抓包接口：
 *   POST https://gateway.kugou.com/youth/v1/song/tag_card_recommend
 *
 * 请求特点：与 single_card_recommend 参数形态类似，但 URL 不带 card_id/pagesize；
 * 请求体 {source_mixsong:"", tagid:"", u_info:""}。
 *
 * 响应结构（status=1 时）：
 *   { status: 1, error_code: 0, data: {
 *       card_info: { card_id: 3103, card_title: "曲风盲盒·随机心动", display_style: 2 },
 *       tag_list: [ { label_id, label_name: "欧美", label_desc: "走路带风，欧美热单循环中",
 *                     cover_pic, top_cover_pic, song_list: [ <歌曲实体 x6> ] } ] } }
 *
 * @param {Object} params
 * @param {string} [params.tagid] - 标签 ID（可空，默认服务端随机盲盒）
 * @param {string} [params.source_mixsong] - 来源歌曲标识（可空）
 * @param {string} [params.u_info] - 客户端附加信息串（可空）
 * @param {Object} params.cookie - 登录态（token/userid）
 * @returns {Promise<{status: number, body: Object}>}
 */
const { discoveryCards, signatureConceptAndroidParams } = require('../util');

module.exports = (params, useAxios) => {
  const { CONCEPT_CLIENTVER, buildCardSubRequest, splitSubUrl } = discoveryCards;
  const clienttime = Math.floor(Date.now() / 1000);

  const cred = {
    dfid: params?.cookie?.dfid || '-',
    mid: params?.cookie?.KUGOU_API_MID || params?.cookie?.mid || '',
    token: params?.cookie?.token || '',
    userid: params?.cookie?.userid || 0,
  };

  const sub = buildCardSubRequest(3103, {
    cred,
    clienttime,
    source_mixsong: params?.source_mixsong || '',
    tagid: params?.tagid || '',
    u_info: params?.u_info || '',
  });

  const { path, params: topParams } = splitSubUrl(sub);

  return useAxios({
    url: path,
    method: sub.method,
    data: sub.body || undefined,
    params: topParams,
    clearDefaultParams: true,
    cookie: params?.cookie || {},
    headers: {
      'User-Agent': `Android16-1070-${CONCEPT_CLIENTVER}-130-0-DiscoveryCard-wifi`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};
