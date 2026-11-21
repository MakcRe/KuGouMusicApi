/**
 * 发现页推荐卡片（批量代理）
 *
 * 对应酷狗概念版 Android 客户端「发现页」推荐卡片流（潮流尝鲜 / 私人专属好歌 /
 * 曲风盲盒·随机心动 / 概念er新推 / 喜欢这首歌的TA也喜欢 / VIP专属推荐 /
 * 小众宝藏佳作 / 频道推荐 / 概念实验室 / AI免费听 等），抓包接口：
 *   POST https://gateway.kugou.com/card/v1/pxy/youth_recommend
 *   POST https://gateway.kugou.com/card/v1/pxy/listen            （历史入口，参数形态一致）
 *
 * 客户端把每张卡片的真实请求（url/body/method/module）打包为 requests 数组发给代理；
 * 服务端按 card_size 决定本轮返回哪些卡片（实测每批 ≤3 张）并重排顺序：
 *   { status: 1, errcode: 0, data: {
 *       responses: [{ module, status, body: "<子接口原始 JSON 字符串>" }],
 *       card_rank: [本轮返回的卡片 ID 顺序], timestamp } }
 * 客户端按 card_rank 剔除已取卡片后循环分批拉取，直至取满 14 张卡片。
 *
 * 卡片 ID ↔ 标题（标题以响应内 card_info.card_title 为准，此处为实测值）：
 *   3001 私人专属好歌  3004 小众宝藏佳作  3005 潮流尝鲜  3006 VIP专属推荐
 *   3007/3014/3032 喜欢这首歌的TA也喜欢  3101 概念er新推  3102 喜欢「xx」的TA也喜欢
 *   3103 曲风盲盒·随机心动  3104 频道推荐  3105 长音频推荐  3106 概念实验室  3107 AI免费听
 *
 * @param {Object} params
 * @param {number[]|string} [params.cards] - 本批请求的卡片 ID 列表（数组或逗号分隔串）。
 *   默认完整客户端卡片列表（无 source_mixsong 时自动剔除 3007，与客户端行为一致）
 * @param {number} [params.card_size] - 每批卡片数（客户端固定 3，实测 >3 报「参数不合法」）
 * @param {'youth_recommend'|'listen'} [params.endpoint] - 代理端点，默认 youth_recommend
 * @param {string} [params.source_mixsong] - 3007 卡来源歌曲标识（最近播放）
 * @param {string} [params.tagid] - 标签 ID（3102 等可指定标签）
 * @param {string} [params.u_info] - 客户端附加信息串（实测可空）
 * @param {Array<string>} [params.ufeature] - 行为特征串数组（如 "y_hot|4|1795269731"），可选
 * @param {boolean} [params.parse] - 是否把每个子响应 body 解析为对象后返回（默认 false 返回原始代理结构）
 * @param {Object} params.cookie - 登录态（token/userid），无登录时部分卡片可能为空
 * @returns {Promise<{status: number, body: Object}>}
 */
const { discoveryCards, signatureConceptAndroidParams } = require('../util');

module.exports = (params, useAxios) => {
  const {
    CONCEPT_APPID,
    CONCEPT_CLIENTVER,
    DISCOVERY_CARD_LIST,
    CARD_MODULES,
    buildCardSubRequest,
  } = discoveryCards;

  // ---- 解析卡片列表 ----
  let cards = params?.cards;
  if (typeof cards === 'string') {
    cards = cards.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => n > 0);
  } else if (!Array.isArray(cards) || cards.length === 0) {
    // 默认完整客户端卡片列表；与客户端一致：无最近播放歌曲（source_mixsong）时不带 3007，
    // 否则 3007 子请求因缺来源歌曲被服务端拒（error_code 20003）
    cards = DISCOVERY_CARD_LIST.filter((id) => id !== 3007 || params?.source_mixsong);
  } else {
    cards = cards.map(Number).filter((n) => CARD_MODULES[n]);
  }
  // 未知卡片直接丢弃，避免整包「参数不合法」
  cards = cards.filter((id) => CARD_MODULES[id]);

  // 客户端行为：3007 在无最近播放歌曲时跳过子请求；此处保留传参能力，由调用方决定
  const cardSize = Math.min(Math.max(parseInt(params?.card_size ?? 3, 10) || 3, 1), 3);
  const endpoint = params?.endpoint === 'listen' ? 'listen' : 'youth_recommend';
  const clienttime = Math.floor(Date.now() / 1000);

  const cred = {
    dfid: params?.cookie?.dfid || '-',
    mid: params?.cookie?.KUGOU_API_MID || params?.cookie?.mid || '',
    token: params?.cookie?.token || '',
    userid: params?.cookie?.userid || 0,
  };

  // ---- 构造子请求（每个子请求独立签名，与客户端一致） ----
  const subOptions = {
    cred,
    clienttime,
    source_mixsong: params?.source_mixsong || '',
    tagid: params?.tagid || '',
    u_info: params?.u_info || '',
    page: params?.page,
  };
  const requests = cards.map((id) => buildCardSubRequest(id, subOptions));

  const data = { requests };
  if (Array.isArray(params?.ufeature) && params.ufeature.length > 0) {
    data.ufeature = params.ufeature;
  }
  const body = JSON.stringify(data);

  // ---- 顶层代理请求参数与签名（概念版固定身份） ----
  const topParams = {
    dfid: cred.dfid,
    mid: cred.mid,
    uuid: '-',
    appid: CONCEPT_APPID,
    clientver: CONCEPT_CLIENTVER,
    clienttime,
    token: cred.token,
    userid: String(cred.userid || 0),
    card_size: String(cardSize),
    card_rank: cards.join(','),
  };
  topParams.signature = signatureConceptAndroidParams(topParams, body);

  return useAxios({
    url: `/card/v1/pxy/${endpoint}`,
    method: 'POST',
    data: data,
    params: topParams,
    clearDefaultParams: true, // 顶层参数/签名已自行构造，避免注入默认参数破坏签名
    cookie: params?.cookie || {},
    headers: {
      'User-Agent': `Android16-1070-${CONCEPT_CLIENTVER}-130-0-DiscoveryCard-wifi`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  }).then((res) => {
    // parse=true 时把各子响应 body（JSON 字符串）解析为对象，方便直接消费
    if (params?.parse && res.body?.data?.responses) {
      res.body.data.responses = res.body.data.responses.map((r) => {
        try {
          return { ...r, body: JSON.parse(r.body) };
        } catch (e) {
          return r;
        }
      });
    }
    return res;
  });
};
