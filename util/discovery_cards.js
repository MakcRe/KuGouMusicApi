/**
 * @fileoverview 酷狗概念版「发现页推荐卡片」协议工具
 *
 * 逆向来源：酷狗概念版 Android 5.3.21（com.kugou.android.lite，versionCode 11621）
 *   - com.kugou.android.app.home.discovery.protocol.DiscoveryCardProtocol      批量代理与子请求分发
 *   - ...protocol.DiscoveryCardDetailProtocol / DiscoveryCardTagRecProtocol    单卡片 / 曲风盲盒子请求
 *   - ...protocol.DiscoveryCardLongAudioRecProtocol / DiscoveryCardLabProtocol 长音频 / 概念实验室子请求
 *   - ...card.entity.DiscoveryCardInfo$Companion                               卡片 ID ↔ module 名映射
 * 并经真机抓包（reqable 回环代理）与 PC 探针逐一复现验证。
 *
 * 发现页推荐流架构：
 *   客户端把每张卡片的真实请求（url/body/method/module）打包成 `requests` 数组，
 *   POST 到批量代理端点 card/v1/pxy/youth_recommend（历史入口 card/v1/pxy/listen），
 *   服务端按 `card_size`（实测每批最多 3 张）决定本轮返回哪些卡片并重排顺序，
 *   响应 data.responses[].body 为各子接口的原始 JSON 字符串，data.card_rank 为本轮卡片顺序。
 *   客户端按响应 card_rank 剔除已返回卡片后循环分批拉取，直至取满 14 张。
 *
 * 卡片 ID ↔ module 名 ↔ 界面标题（标题由服务端 card_info.card_title 下发，
 *   3101 标题「概念er新推」为客户端 CardBaseViewHolder 硬编码）：
 *   3001 y_song_module_1  私人专属好歌           single_card_recommend pagesize=30
 *   3004 y_song_module_4  小众宝藏佳作           single_card_recommend pagesize=10
 *   3005 y_song_module_5  潮流尝鲜               single_card_recommend pagesize=30（UGC/频道向内容）
 *   3006 y_song_module_6  VIP专属推荐            single_card_recommend pagesize=10
 *   3007 y_song_module_7  喜欢这首歌的TA也喜欢    single_card_recommend pagesize=30，需 source_mixsong
 *   3014 y_song_module_14 喜欢这首歌的TA也喜欢    single_card_recommend pagesize=30（服务端自选最近播放歌曲）
 *   3032 y_song_module_32 喜欢这首歌的TA也喜欢    single_card_recommend pagesize=30（同 3014，服务端侧记录）
 *   3101 y_hot            概念er新推             single_card_recommend pagesize=30
 *   3102 y_tag            喜欢「xx」的TA也喜欢    single_card_recommend pagesize=30（标签动态标题，如「摇滚」）
 *   3103 y_style          曲风盲盒·随机心动       tag_card_recommend（无 card_id，返回 tag_list 多标签各带歌）
 *   3104 y_channel        频道推荐               youth/api/channel/v3/get_featured_channel
 *   3105 y_longaudio      长音频推荐             youth/v1/song/longaudio_recommend（客户端 AB 门控）
 *   3106 y_lab            概念实验室             youth/v1/song/lab_feature_list（GET，注意 card_id=3105 为客户端原样行为）
 *   3107 y_aisong         AI免费听               concepts/v1/ai/recommend_song {page,pagesize:6,source:1}
 *
 * @module util/discovery_cards
 * @requires ./helper - 概念版固定盐签名
 * @requires ./config.json - 概念版身份常量
 */

const { signatureConceptAndroidParams } = require('./helper');
const { liteAppid } = require('./config.json');

// 概念版固定身份（发现页卡片族接口的实测值；clientver 取真机 5.3.21 的 11621，
// 高于 util/config.json 的 liteClientver=11440 —— 部分概念版端点对低版本静默返回空数据）
const CONCEPT_APPID = String(liteAppid); // "3116"
const CONCEPT_CLIENTVER = '11621';
const CONCEPT_PLATFORM = 'android';
const CONCEPT_AREA_CODE = '1';

/**
 * 卡片 ID ↔ 子请求 module 名（来自 DiscoveryCardInfo$Companion.getCardModuleName）
 * @type {Record<number, string>}
 */
const CARD_MODULES = {
  3001: 'y_song_module_1',
  3004: 'y_song_module_4',
  3005: 'y_song_module_5',
  3006: 'y_song_module_6',
  3007: 'y_song_module_7',
  3014: 'y_song_module_14',
  3032: 'y_song_module_32',
  3101: 'y_hot',
  3102: 'y_tag',
  3103: 'y_style',
  3104: 'y_channel',
  3105: 'y_longaudio',
  3106: 'y_lab',
  3107: 'y_aisong',
};

/**
 * 卡片 ID ↔ 界面标题参考（服务端下发，仅供文档参考，实际以 card_info.card_title 为准）
 * @type {Record<number, string>}
 */
const CARD_TITLES = {
  3001: '私人专属好歌',
  3004: '小众宝藏佳作',
  3005: '潮流尝鲜',
  3006: 'VIP专属推荐',
  3007: '喜欢这首歌的TA也喜欢',
  3014: '喜欢这首歌的TA也喜欢',
  3032: '喜欢这首歌的TA也喜欢',
  3101: '概念er新推',
  3102: '喜欢「xx」的TA也喜欢',
  3103: '曲风盲盒·随机心动',
  3104: '频道推荐',
  3105: '长音频推荐',
  3106: '概念实验室',
  3107: 'AI免费听',
};

/**
 * 客户端对单卡片子请求的默认 pagesize（抓包值：3004/3006 为 10，其余 30）
 * @type {Record<number, number>}
 */
const CARD_PAGE_SIZE = {
  3004: 10,
  3006: 10,
};

/**
 * 客户端发现页卡片列表（DiscoveryCardInfo.b() 的静态顺序；
 * 3105 受 AB 配置门控，3007 需要最近播放歌曲时才会附加子请求）
 * @type {number[]}
 */
const DISCOVERY_CARD_LIST = [3007, 3032, 3014, 3104, 3101, 3001, 3006, 3102, 3004, 3005, 3103, 3105, 3106, 3107];

/**
 * 构造子请求的公共 query（子请求独立签名，与真实客户端一致：
 * 顶层代理请求与每个子请求使用同一个 clienttime）
 *
 * @param {Object} cred - 凭据 { dfid, mid, token, userid }
 * @param {number} clienttime - 秒级时间戳（顶层与子请求共用）
 * @returns {Object} 公共 query 参数
 */
const commonSubQuery = (cred, clienttime) => ({
  area_code: CONCEPT_AREA_CODE,
  mid: cred.mid,
  userid: String(cred.userid || 0),
  uuid: '-',
  platform: CONCEPT_PLATFORM,
  token: cred.token || '',
  dfid: cred.dfid || '-',
  appid: CONCEPT_APPID,
  clientver: CONCEPT_CLIENTVER,
  clienttime: String(clienttime),
});

/**
 * query 对象 → URL 查询串（编码方式与客户端一致）
 * @param {Object} q - 含 signature 的 query 参数
 * @returns {string}
 */
const toQueryString = (q) =>
  Object.keys(q)
    .map((k) => `${k}=${encodeURIComponent(q[k])}`)
    .join('&');

/**
 * 构造单张卡片的子请求描述（DiscoveryCardProtocol.b 的等价实现）
 *
 * @param {number} cardId - 卡片 ID（见 CARD_MODULES）
 * @param {Object} [options]
 * @param {Object} options.cred - 凭据 { dfid, mid, token, userid }
 * @param {number} [options.clienttime] - 秒级时间戳，默认当前时间
 * @param {string} [options.source_mixsong] - 3007 卡所需来源歌曲标识（最近播放）
 * @param {string} [options.tagid] - 标签 ID（3102 等可指定标签）
 * @param {string} [options.u_info] - 客户端附加信息串（实测可空）
 * @param {number} [options.pagesize] - 覆盖默认 pagesize
 * @param {number} [options.page] - 3107 AI 免费听的页码，默认 1
 * @param {string} [options.bi_index] - 3104 频道推荐的 bi_index，默认 '0'
 * @param {string} [options.label] - 3104 频道推荐的标签过滤，默认空
 * @returns {{url: string, body: string, method: string, headers: string, module: string}}
 */
const buildCardSubRequest = (cardId, options = {}) => {
  const cred = options.cred || {};
  const clienttime = options.clienttime || Math.floor(Date.now() / 1000);
  const module = CARD_MODULES[cardId];
  if (!module) {
    throw new Error(`unknown discovery card id: ${cardId}`);
  }

  let query;
  let body = '';
  let method = 'POST';
  let path;

  switch (cardId) {
    // 曲风盲盒·随机心动：tag_card_recommend，无 card_id/pagesize
    case 3103: {
      query = { ...commonSubQuery(cred, clienttime), ver: 'v2', module_id: '1' };
      body = JSON.stringify({ source_mixsong: options.source_mixsong || '', tagid: options.tagid || '', u_info: options.u_info || '' });
      path = '/youth/v1/song/tag_card_recommend';
      break;
    }
    // 频道推荐：get_featured_channel（body 为客户端频道公共参数结构）
    case 3104: {
      query = { ...commonSubQuery(cred, clienttime), bi_index: options.bi_index || '0', label: options.label || '' };
      body = JSON.stringify({
        uuid: '-',
        platform: CONCEPT_PLATFORM,
        clientver: Number(CONCEPT_CLIENTVER),
        dfid: cred.dfid || '-',
        clienttime: Number(clienttime),
        vip_flags: 3,
        action: 'login',
        userid: Number(cred.userid || 0),
        vip_type: 6,
        playlist_ver: 2,
        area_code: CONCEPT_AREA_CODE,
        u_info: options.u_info || '',
        appid: CONCEPT_APPID,
        mid: cred.mid,
        m_type: 1,
      });
      path = '/youth/api/channel/v3/get_featured_channel';
      break;
    }
    // 长音频推荐：longaudio_recommend，card_id=3105
    // 请求体为客户端 aj.a.a(null) 的结果：{"album_playlist":[...]}（本地专辑播放历史，
    // 无记录时为空数组），实测传 {"album_playlist":[]} 服务端正常返回
    case 3105: {
      query = { ...commonSubQuery(cred, clienttime), module_id: '1', card_id: '3105' };
      body = JSON.stringify({ album_playlist: options.album_playlist || [] });
      path = '/youth/v1/song/longaudio_recommend';
      break;
    }
    // 概念实验室：lab_feature_list 为 GET，且 card_id 参数值即为 3105（客户端原样行为，抓包证实）
    case 3106: {
      query = { ...commonSubQuery(cred, clienttime), module_id: '1', card_id: '3105' };
      method = 'GET';
      path = '/youth/v1/song/lab_feature_list';
      break;
    }
    // AI免费听：concepts/v1/ai/recommend_song
    case 3107: {
      query = { ...commonSubQuery(cred, clienttime) };
      body = JSON.stringify({ page: options.page || 1, pagesize: options.pagesize || 6, source: 1 });
      path = '/concepts/v1/ai/recommend_song';
      break;
    }
    // 其余卡片：single_card_recommend（ver=v2，pagesize 默认按客户端映射）
    default: {
      query = {
        ...commonSubQuery(cred, clienttime),
        ver: 'v2',
        module_id: '1',
        card_id: String(cardId),
        pagesize: String(options.pagesize || CARD_PAGE_SIZE[cardId] || 30),
      };
      body = JSON.stringify({ source_mixsong: options.source_mixsong || '', tagid: options.tagid || '', u_info: options.u_info || '' });
      path = '/youth/v1/song/single_card_recommend';
      break;
    }
  }

  // 子请求独立签名（客户端行为：每个子 URL 自带 signature）
  const signature = signatureConceptAndroidParams(query, body);
  const url = `https://gateway.kugou.com${path}?${toQueryString({ ...query, signature })}`;

  return { url, body, method, headers: '', module };
};

/**
 * 拆解 buildCardSubRequest 生成的完整子请求 URL 为路径与已签名 query 参数对象。
 * 单卡直连模块共用：拆出的 path + params（含 signature）原样直发，沿用子请求签名。
 *
 * @param {{url: string}} sub - buildCardSubRequest 返回值
 * @returns {{path: string, params: Object}} path 为网关相对路径；params 为解码后的 query 键值对
 */
const splitSubUrl = (sub) => {
  const [path, qs] = sub.url.replace('https://gateway.kugou.com', '').split('?');
  const params = {};
  qs.split('&').forEach((kv) => {
    const idx = kv.indexOf('=');
    params[decodeURIComponent(kv.slice(0, idx))] = decodeURIComponent(kv.slice(idx + 1));
  });
  return { path, params };
};

module.exports = {
  CONCEPT_APPID,
  CONCEPT_CLIENTVER,
  CONCEPT_PLATFORM,
  CONCEPT_AREA_CODE,
  CARD_MODULES,
  CARD_TITLES,
  CARD_PAGE_SIZE,
  DISCOVERY_CARD_LIST,
  buildCardSubRequest,
  splitSubUrl,
  commonSubQuery,
  toQueryString,
};
