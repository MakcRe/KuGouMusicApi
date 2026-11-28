/**
 * 概念实验室（lab_feature_list）
 *
 * 对应酷狗概念版发现页「概念实验室」卡片（card_id=3106，module=y_lab），接口：
 *   GET https://gateway.kugou.com/youth/v1/song/lab_feature_list
 *
 * 注意：GET 请求无请求体；query 中 card_id 固定为 3105（客户端源码即如此，疑似
 * 上游 copy-paste，实测服务端照此接受）。
 *
 * 响应结构（status=1 时）：
 *   { status: 1, error_code: 0, data: {
 *       card_info: { card_id: 3106, card_title: "概念实验室" },
 *       list: [ { webview_type, show_img, select_type, name, url, redirect } ] } }
 *
 * @param {Object} params
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

  // GET 无请求体，签名 data 传空串
  const sub = buildCardSubRequest(3106, { cred, clienttime });

  const { path, params: topParams } = splitSubUrl(sub);

  return useAxios({
    url: path,
    method: 'GET',
    params: topParams,
    clearDefaultParams: true,
    cookie: params?.cookie || {},
    headers: {
      'User-Agent': `Android16-1070-${CONCEPT_CLIENTVER}-130-0-DiscoveryCard-wifi`,
    },
  });
};
