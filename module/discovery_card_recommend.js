/**
 * 发现页推荐卡片（批量代理）
 *
 * 对应酷狗概念版 Android 客户端「发现页」推荐卡片流（潮流尝鲜 / 私人专属好歌 /
 * 曲风盲盒·随机心动 / 概念er新推 / 喜欢这首歌的TA也喜欢 / VIP专属推荐 /
 * 小众宝藏佳作 / 频道推荐 / 概念实验室 / AI免费听 等），接口：
 *   POST https://gateway.kugou.com/card/v1/pxy/youth_recommend
 *   POST https://gateway.kugou.com/card/v1/pxy/listen            （历史入口，参数形态一致）
 *
 * 客户端把每张卡片的真实请求（url/body/method/module）打包为 requests 数组发给代理；
 * youth_recommend 每轮最多返回 3 个响应（card_size 传 4+ 或 0 同样按 3 处理，不报错）
 * 并按卡片权重重排顺序：
 *   { status: 1, errcode: 0, data: {
 *       responses: [{ module, status, body: "<子接口原始 JSON 字符串>" }],
 *       card_rank: [本次请求的卡片 ID 顺序], timestamp } }
 * 客户端按返回的 module 剔除已取卡片后继续拉取：首次加载用 youth_recommend 携带完整
 * 卡片列表（服务端只返回 3 张），滚动加载更多时用 listen 每次最多带 3 个待请求卡片
 * （DiscoveryCardPresenter.s0() 限制），直至取满 14 张卡片。listen 不带
 * card_size/card_rank/ufeature，单次最多返回 12 个响应。
 *
 * 卡片 ID ↔ 标题（标题以响应内 card_info.card_title 为准，此处为实测值）：
 *   3001 私人专属好歌  3004 小众宝藏佳作  3005 潮流尝鲜  3006 VIP专属推荐
 *   3007/3014/3032 喜欢这首歌的TA也喜欢  3101 概念er新推  3102 喜欢「xx」的TA也喜欢
 *   3103 曲风盲盒·随机心动  3104 频道推荐  3105 长音频推荐  3106 概念实验室  3107 AI免费听
 *
 * @param {Object} params
 * @param {number[]|string} [params.cards] - 本批请求的卡片 ID 列表（数组或逗号分隔串）。
 *   默认完整客户端卡片列表（无 source_mixsong 时自动剔除 3007，与客户端行为一致）
 * @param {number} [params.card_size] - 每批卡片数（客户端固定 3；仅对 youth_recommend 生效，
 *   服务端每轮最多返回 3 个响应，传 4+ 或 0 同样按 3 处理，不会报错也不会多返回）
 * @param {'youth_recommend'|'listen'} [params.endpoint] - 代理端点，默认 youth_recommend。
 *   listen 为历史入口/客户端滚动加载更多所用：不带 card_size/card_rank/ufeature，
 *   单次最多返回 12 个响应
 * @param {boolean} [params.full] - 按客户端行为循环拉全：首次用端点携带完整 cards
 *   （youth_recommend 时服务端只回 3 张），后续补拉与客户端一致走 listen、
 *   每次最多 3 个待请求卡片，直到 cards 中卡片全部返回后合并到 data.responses，
 *   并附 data.batch_count（实际请求轮数）；默认只请求单批
 * @param {string} [params.source_mixsong] - 3007 卡来源歌曲标识（最近播放）
 * @param {string} [params.tagid] - 标签 ID（3102 等可指定标签）
 * @param {string} [params.u_info] - 客户端附加信息串（实测可空）
 * @param {string} [params.bi_index] - 3104 频道推荐曝光索引（默认 '0'）
 * @param {string} [params.label] - 3104 频道推荐标签过滤（默认空）
 * @param {Array<Object>|string} [params.album_playlist] - 3105 长音频的本地专辑播放历史
 *   （数组或 JSON 字符串，默认空数组）
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
    CARD_BY_MODULE,
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

  if (cards.length === 0) {
    return Promise.reject({
      status: 502,
      body: { status: 0, error_code: 1, error: 'cards 为空或均为未知卡片 ID' },
    });
  }

  const cardSize = Math.min(Math.max(parseInt(params?.card_size ?? 3, 10) || 3, 1), 3);
  const endpoint = params?.endpoint === 'listen' ? 'listen' : 'youth_recommend';
  const full = params?.full === true || params?.full === 1 || params?.full === '1' || params?.full === 'true';

  const cred = {
    dfid: params?.cookie?.dfid || '-',
    mid: params?.cookie?.KUGOU_API_MID || params?.cookie?.mid || '',
    token: params?.cookie?.token || '',
    userid: params?.cookie?.userid || 0,
  };

  // ---- 构造一批子请求（每个子请求独立签名，与客户端一致；顶层与子请求同一 clienttime） ----
  // 客户端差异：youth_recommend 携带 card_size/card_rank/ufeature；
  // listen（历史入口 + 滚动加载更多）不携带这三项（DiscoveryCardProtocol.a 传 card_size=0）。
  const buildBatch = (cardIds, batchEndpoint = endpoint) => {
    const clienttime = Math.floor(Date.now() / 1000);
    const subOptions = {
      cred,
      clienttime,
      source_mixsong: params?.source_mixsong || '',
      tagid: params?.tagid || '',
      u_info: params?.u_info || '',
      page: params?.page,
      bi_index: params?.bi_index,
      label: params?.label,
      album_playlist: params?.album_playlist,
    };
    const requests = cardIds.map((id) => buildCardSubRequest(id, subOptions));

    const data = { requests };
    if (batchEndpoint === 'youth_recommend' && Array.isArray(params?.ufeature) && params.ufeature.length > 0) {
      data.ufeature = params.ufeature;
    }

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
    };
    if (batchEndpoint === 'youth_recommend') {
      topParams.card_size = String(cardSize);
      topParams.card_rank = cardIds.join(',');
    }
    topParams.signature = signatureConceptAndroidParams(topParams, JSON.stringify(data));

    return { data, topParams, batchEndpoint };
  };

  const send = ({ data, topParams, batchEndpoint }) =>
    useAxios({
      url: `/card/v1/pxy/${batchEndpoint}`,
      method: 'POST',
      data,
      params: topParams,
      clearDefaultParams: true, // 顶层参数/签名已自行构造，避免注入默认参数破坏签名
      cookie: params?.cookie || {},
      headers: {
        'User-Agent': `Android16-1070-${CONCEPT_CLIENTVER}-130-0-DiscoveryCard-wifi`,
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

  // parse=true 时把各子响应 body（JSON 字符串）解析为对象，方便直接消费
  const applyParse = (res) => {
    if (params?.parse && Array.isArray(res.body?.data?.responses)) {
      res.body.data.responses = res.body.data.responses.map((r) => {
        try {
          return { ...r, body: JSON.parse(r.body) };
        } catch (e) {
          return r;
        }
      });
    }
    return res;
  };

  if (!full) {
    return send(buildBatch(cards)).then(applyParse);
  }

  // ---- full：模拟客户端行为循环分批，直到 cards 中的卡片都被服务端返回 ----
  // 客户端首次请求用 youth_recommend 携带完整卡片列表（服务端每轮只回 3 张），
  // 后续“加载更多”用 listen 每次最多带 3 个待请求卡片（s0() 限制）。
  return (async () => {
    const merged = [];
    const seenModules = new Set();
    let remaining = cards.slice();
    let last = null;
    let rounds = 0;
    // card_size 可低至 1，按最坏情况（每轮仅 1 张）给足轮次
    const maxRounds = cards.length + 3;

    while (remaining.length > 0 && rounds < maxRounds) {
      rounds += 1;
      const batchEndpoint = rounds === 1 ? endpoint : 'listen';
      const batchCards =
        rounds === 1 && endpoint === 'youth_recommend' ? cards.slice() : remaining.slice(0, cardSize);

      const res = await send(buildBatch(batchCards, batchEndpoint));
      last = res;

      const list = Array.isArray(res.body?.data?.responses) ? res.body.data.responses : [];
      if (list.length === 0) break;

      const returnedIds = new Set();
      list.forEach((item) => {
        if (!seenModules.has(item.module)) {
          seenModules.add(item.module);
          merged.push(item);
        }
        if (CARD_BY_MODULE[item.module]) returnedIds.add(CARD_BY_MODULE[item.module]);
      });

      const next = remaining.filter((id) => !returnedIds.has(id));
      // 本轮没有任何已请求卡片被返回，继续循环只会重复请求
      if (next.length === remaining.length) break;
      remaining = next;
    }

    if (last?.body?.data) {
      last.body.data.responses = merged;
      if (endpoint === 'youth_recommend') {
        // 合并后按服务端实际返回顺序重写 card_rank，与 responses 对齐
        last.body.data.card_rank = merged
          .map((item) => CARD_BY_MODULE[item.module])
          .filter(Boolean)
          .map(String);
      }
      last.body.data.batch_count = rounds;
    }
    return applyParse(last);
  })();
};