/**
 * 发现页频道推荐（get_featured_channel）
 *
 * 对应酷狗概念版发现页「频道推荐」卡片（card_id=3104，module=y_channel），抓包接口：
 *   POST https://gateway.kugou.com/youth/api/channel/v3/get_featured_channel
 *
 * 请求体为客户端频道公共参数结构（uuid/platform/clientver/dfid/clienttime/vip_flags/
 * action/userid/vip_type/playlist_ver/area_code/u_info/appid/mid/m_type），
 * query 带 bi_index（曝光索引，客户端随卡片位置递增）与 label（标签过滤，默认空）。
 *
 * 响应结构（status=1 时）：data.list 为频道实体数组（实测 9 个），
 * 响应中 card_info.card_title="频道推荐"；频道实体含频道名/封面/播放入口等字段。
 *
 * @param {Object} params
 * @param {string|number} [params.bi_index] - 卡片曝光索引（默认 '0'）
 * @param {string} [params.label] - 频道标签过滤（默认空）
 * @param {string} [params.u_info] - 客户端附加信息串（实测可空）
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

  const sub = buildCardSubRequest(3104, {
    cred,
    clienttime,
    bi_index: params?.bi_index != null ? String(params.bi_index) : '0',
    label: params?.label || '',
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
