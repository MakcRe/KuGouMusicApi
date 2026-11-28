/**
 * 概念版听歌等级榜（全球年榜/省月榜/市周榜 + 听歌经验倍率）
 *
 * 对应酷狗概念版「我的 → 听歌等级」页的榜单与倍率数据源：
 *   POST https://userinfoservice.kugou.com/v1/youth/get_rank_list
 *
 * 客户端行为：
 * - 页面每次加载并发调 3 次，对应页面的三个榜单 tab：全球年榜 / 省月榜 / 市周榜；
 *   切换榜单 tab 触发单发。实测指纹：全球年榜 total 1000（rank_type=2）、
 *   省月榜/市周榜 total 100，榜单 top3 分数量级 年榜 >> 月榜 > 周榜，
 *   响应 `rank_type` 不足以单独区分榜单，建议结合首条目与 total 判断
 * - 响应中大量 `"total":500` 是概念版会员的 vip_limit_quota（每日配额），与榜单 total 无关
 * - 响应带 `p_speed_info`（倍率档位表 {p0:"1",p1:"1.5",p2:"2",p3:"2.5"}）与本人 `p_speed`
 * - 本人区带 `rank_percent`（排名百分位，页面显示为「TOP xx%」角标，如 43 → TOP43%）
 *   与 `rank_distance`（距榜首分数差）、`province_id`/`city_id`（行政区划）
 * - 榜单条目含每人的 `p_speed`（实际倍率）与完整 `vipinfo`
 *
 * ⚠️ 请求体是客户端本地加密的密文（RSA+AES），本项目无法构造，只能透传：
 *   {"userid":"123456789","p":"<hex 密文>","params":"<hex 密文>"}
 *   `p` 与 `params` 需从概念版客户端的真实请求体中获取后传入。
 *   密文绑定 clienttime（KG-CLIENTTIMEMS），有时效性，获取后尽快调用；
 *   响应为明文 JSON，不受影响。
 *
 * 倍率判定规则（服务端逻辑，实测归纳）：
 *   1×   = 非会员 / 免费试用概念版 VIP（busi_vip.is_paid_vip=0）
 *   1.5× = 月度普通会员（user_type=13 且 user_y_type=0；概念版付费非年费）
 *   2×   = 年费普通会员（user_y_type=13/5）或 月度豪华/超级 VIP（user_type=21 且 user_y_type=0）
 *   2.5× = 年费豪华/超级 VIP（user_type=21 且 user_y_type=21）
 *
 * @param {string} params.p - 必填，客户端请求体中的 p 密文（hex）
 * @param {string} params.params - 必填，客户端请求体中的 params 密文（hex）
 * @param {string} [params.userid] - 用户 ID（默认取 cookie.userid；需与密文内的 userid 一致）
 * @param {string} [params.kg_devid] - 可选，透传客户端请求头 KG-DEVID（设备绑定串，提高请求成功率）
 * @param {Object} params.cookie - 登录态（token/userid）
 * @returns {Promise<{status: number, body: Object}>}
 */
const { discoveryCards, srcappid, signatureConceptAndroidParams } = require('../util');
const { CONCEPT_APPID, CONCEPT_CLIENTVER } = discoveryCards;

module.exports = (params, useAxios) => {
  const cookie = params?.cookie || {};
  const p = `${params?.p ?? ''}`;
  const encParams = `${params?.params ?? ''}`;
  if (!p || !encParams) {
    return Promise.reject({
      status: 502,
      body: {
        status: 0,
        error_code: 1,
        error:
          '缺少密文参数 p / params：该接口请求体由概念版客户端本地加密（RSA+AES），无法本地构造。' +
          '请从概念版客户端的真实请求体中复制 p 与 params 字段传入（密文有时效性）。',
      },
    });
  }

  const userid = `${params?.userid || cookie?.userid || ''}`;
  const token = `${params?.token || cookie?.token || ''}`;
  const mid = `${params?.mid || cookie?.KUGOU_API_MID || cookie?.mid || ''}`;
  const dfid = `${params?.dfid || cookie?.dfid || '-'}`;
  const clienttime = Math.floor(Date.now() / 1000);
  const clienttimeMs = `${clienttime}${Math.floor(Math.random() * 900 + 100)}`.slice(0, 13);

  // 密文体 key 顺序与客户端一致：userid → p → params
  const data = { userid, p, params: encParams };

  const query = {
    appid: CONCEPT_APPID,
    mid,
    uuid: '-',
    dfid,
    userid,
    token,
    clientver: CONCEPT_CLIENTVER,
    clienttime,
    srcappid,
  };
  query.signature = signatureConceptAndroidParams(query, JSON.stringify(data));

  return useAxios({
    baseURL: 'https://userinfoservice.kugou.com',
    url: '/v1/youth/get_rank_list',
    method: 'POST',
    data,
    params: query,
    clearDefaultParams: true, // 顶层参数/签名已自行构造，避免注入默认参数破坏签名
    cookie,
    headers: {
      'User-Agent': `Android16-1070-${CONCEPT_CLIENTVER}-130-0-mobileCallProtocol-wifi`,
      'Content-Type': 'application/json',
      'x-router': 'userinfoservice.kugou.com',
      'KG-THash': '26c94b9',
      'KG-Rec': '1',
      'KG-RC': '1',
      'KG-RFB': '0',
      'KG-FAKE': userid,
      'KG-CLIENTTIMEMS': clienttimeMs,
      ...(params?.kg_devid ? { 'KG-DEVID': `${params.kg_devid}` } : {}),
    },
  });
};
