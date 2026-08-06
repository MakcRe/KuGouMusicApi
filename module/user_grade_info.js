// 酷狗听歌等级信息查询与听歌时长上报
//
// 两种模式：
//  1. 查询模式（默认）：返回服务器当前累计听歌时长（d_sec）、等级（p_grade）、积分等
//  2. 上报模式：传入 d_sec + diff_sec，同步本地累计听歌时长
//     d_sec    本地累计听歌秒数（须 >= 服务器当前值）
//     diff_sec 上次同步后的新增秒数
//     md5      = MD5(d_sec + diff_sec + y_type + m_type)
//
// 双协议支持：
//  - v2（lite 专属）: userinfo.user.kugou.com/v2/get_grade_info，body 平铺参数 + key 校验
//  - v4（标准版）   : userinfoservice.kugou.com/v4/get_grade_info，pk(RSA)+params(AES) 加密结构
// 默认跟随 platform 选择；可用 params.protocol 强制指定（'v2' | 'v4'）。
//
// 说明：v2 协议为概念版（lite）客户端用户等级体系，lite 平台（platform=lite）下上报有效
// （服务器按 diff_sec 累加记账，增量受距上次上报时间约束，请按正常听歌节奏调用）。
// v4 为标准版客户端协议：pk/params 加密结构 + query signature，标准版账号可查询；
// 标准版听歌时长由服务端真实播放统计（延迟）维护，get_grade_info 仅作查询/对账，
// 标准版上报增量不会被记账。

const crypto = require('crypto');
const {
  cryptoAesEncrypt,
  cryptoMd5,
  cryptoRSAEncrypt,
  publicLiteRasKey,
  publicRasKey,
} = require('../util');
const { appid, clientver, liteAppid, liteClientver } = require('../util/config.json');

// 平台签名盐值（与 util/helper.js、util/crypto.js 双平台配置保持一致）
const APPKEY_MAP = {
  lite: 'LnT6xpN3khm36zse0QzvmgTZ3waWdRSA',
  standard: 'OIlwieks28dk2k092lksi2UIkp',
};

// v4 通用请求头（KG-DEVID / KG-CLIENTTIMEMS）
const v4Headers = (clientVer, mid, ms) => ({
  'Content-Type': 'application/json; charset=UTF-8',
  'User-Agent': `Android15-1070-${clientVer}-201-0-get_user_grade_info-wifi`,
  'KG-DEVID': mid,
  'KG-CLIENTTIMEMS': String(ms),
  // 注：request.js 会注入默认 kg-thash/kg-rc/kg-rec/kg-rf，
  // 实测差异不影响查询与记账结果，这里不强行覆盖
});

// 构建 v4 上报/查询请求
const buildV4 = (params, useAxios, cfg) => {
  const token = params?.token || params?.cookie?.token || '';
  const userid = String(params?.userid || params?.cookie?.userid || 0);
  const mid = params?.mid || params?.cookie?.mid || params?.cookie?.KUGOU_API_MID || '';
  const dfid = params?.dfid || params?.cookie?.dfid || '-';
  const uuid = params?.uuid || '-';
  const ms = Date.now();
  const clienttime = Math.floor(ms / 1000);

  const { appId, appKey, clientVer, publicKey } = cfg;

  // y_type/m_type（默认 0）
  const y_type = params?.y_type || 0;
  const m_type = params?.m_type || 0;
  const d_sec = params?.d_sec != null ? Number(params.d_sec) : 0;
  const diff_sec = params?.diff_sec != null ? Number(params.diff_sec) : 0;

  // md5 = MD5(d_sec + diff_sec + y_type + m_type)
  const md5 = cryptoMd5(String(d_sec) + String(diff_sec) + String(y_type) + String(m_type));

  // AES 种子 key：16 位纯 hex（AES-128 生成 key 后 hex 取前 16 位）
  const aesSeed = crypto.randomBytes(8).toString('hex');
  const seedMd5 = cryptoMd5(aesSeed);
  // params 加密：AES-256-CBC，key=MD5(seed)[0:32]，iv=MD5(seed)[16:32]
  const paramsEnc = cryptoAesEncrypt(
    { userid, token, md5 },
    { key: seedMd5.substring(0, 32), iv: seedMd5.substring(16, 32) }
  );
  // pk：RSA/ECB/NOPADDING 加密 {clienttime_ms, key}（hex 小写）
  const pk = cryptoRSAEncrypt({ clienttime_ms: ms, key: aesSeed }, publicKey);

  const body = {
    plat: 1,
    userid,
    clienttime_ms: ms,
    type: 0,
    d_sec,
    diff_sec,
    y_type,
    m_type,
    pk,
    params: paramsEnc,
    medal: 0,
  };
  const bodyStr = JSON.stringify(body);

  // query 参数 + signature：MD5(appkey + 排序query + body + appkey)
  const signParams = { clienttime, mid, dfid, uuid, appid: appId, clientver: clientVer };
  const signStr = Object.keys(signParams)
    .sort()
    .map((k) => `${k}=${signParams[k]}`)
    .join('');
  const signature = cryptoMd5(`${appKey}${signStr}${bodyStr}${appKey}`);

  return useAxios({
    baseURL: 'https://userinfoservice.kugou.com',
    url: '/v4/get_grade_info',
    method: 'POST',
    data: bodyStr,
    params: Object.assign({}, signParams, { signature }),
    clearDefaultParams: true,
    notSignature: true, // signature 已在请求中，跳过自动签名
    headers: v4Headers(clientVer, mid, ms),
    cookie: params?.cookie || {},
  });
};

// 构建 v2 上报/查询请求（lite 客户端，原有实现）
const buildV2 = (params, useAxios, cfg) => {
  const token = params?.token || params?.cookie?.token || '';
  const userid = Number(params?.userid || params?.cookie?.userid || 0);
  const mid = params?.mid || params?.cookie?.mid || params?.cookie?.KUGOU_API_MID || '';
  const uuid = params?.uuid || '-';
  const dfid = params?.dfid || params?.cookie?.dfid || '-';
  const type = params?.type || 1;

  const { appId, appKey, clientVer, publicKey } = cfg;
  const clienttime = Math.floor(Date.now() / 1000);

  // 请求校验 key：MD5(appid + appkey + clientver + clienttime)
  const key = crypto
    .createHash('md5')
    .update(appId + appKey + clientVer + clienttime)
    .digest('hex');

  const dataMap = { mid, type, uuid, userid };

  // 上报模式（有缓存）：需要 token 与 d_sec/diff_sec
  const isReport = params?.d_sec != null && params?.diff_sec != null;
  let p;
  if (isReport) {
    const d_sec = Number(params.d_sec);
    const diff_sec = Number(params.diff_sec);
    const y_type = params?.y_type || 0;
    const m_type = params?.m_type || 0;
    const md5 = crypto
      .createHash('md5')
      .update(String(d_sec) + String(diff_sec) + String(y_type) + String(m_type))
      .digest('hex');
    // p 明文：{"token":...,"md5":...}，RSA 加密后 hex 大写
    p = cryptoRSAEncrypt({ token, md5 }, publicKey).toUpperCase();
    Object.assign(dataMap, { d_sec, diff_sec, y_type, m_type });
  } else {
    // 查询模式（无缓存）：p 明文 {"clienttime":...,"userid":...}
    const innerJson = JSON.stringify({ clienttime, userid });
    p = cryptoRSAEncrypt(innerJson, publicKey).toUpperCase();
  }
  dataMap.p = p;

  // 公共参数（body 内）
  Object.assign(dataMap, { appid: appId, clientver: clientVer, clienttime, key });

  return useAxios({
    baseURL: 'http://userinfo.user.kugou.com',
    url: '/v2/get_grade_info',
    method: 'POST',
    data: dataMap,
    params: { dfid }, // 仅 dfid 在 URL query
    clearDefaultParams: true,
    notSignature: true, // 该接口不生成 signature，key 字段即为请求校验
    headers: {
      'Content-Type': 'text/plain; charset=ISO-8859-1',
      'User-Agent': `Android15-1070-${clientVer}-201-0-get_user_grade_info-wifi`,
      // 每次请求生成随机的 KG-THash（模拟客户端行为，固定 7 位 hex）
      'KG-THash': Math.floor(Math.random() * 0xfffffff)
        .toString(16)
        .padStart(7, '0'),
      'KG-Rec': '1',
      'KG-RC': '1',
    },
    cookie: params?.cookie || {},
  });
};

module.exports = (params, useAxios) => {
  const isLite = process.env.platform === 'lite';
  const protocol = params?.protocol || (isLite ? 'v2' : 'v4');

  // 平台参数（支持 params 覆盖；v4 为标准版专属，固定标准平台配置）
  const useV4 = protocol === 'v4';
  const cfg = {
    appId: String(params?.appid || (useV4 ? appid : isLite ? liteAppid : appid)),
    appKey: params?.appkey || APPKEY_MAP[useV4 ? 'standard' : isLite ? 'lite' : 'standard'],
    clientVer: String(params?.clientver || (useV4 ? clientver : isLite ? liteClientver : clientver)),
    publicKey: params?.publicKey || (useV4 ? publicRasKey : isLite ? publicLiteRasKey : publicRasKey),
  };

  return useV4 ? buildV4(params, useAxios, cfg) : buildV2(params, useAxios, cfg);
};
