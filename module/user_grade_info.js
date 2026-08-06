// 酷狗听歌等级信息查询与听歌时长上报
//
// 两种模式（与官方客户端行为一致）：
//  1. 查询模式（默认）：返回服务器当前累计听歌时长（d_sec）、等级（p_grade）、积分等
//  2. 上报模式：传入 d_sec + diff_sec，同步本地累计听歌时长
//     d_sec    本地累计听歌秒数（须 >= 服务器当前值）
//     diff_sec 上次同步后的新增秒数
//     md5      = MD5(d_sec + diff_sec + y_type + m_type)
//
// 说明：本协议为概念版（lite）客户端用户等级体系，标准版账号走该协议上报不会被记账；
// 请在 lite 平台（platform=lite）下使用。服务器按真实时间记账（增量受距上次上报时间约束），
// 请按正常听歌节奏调用。

const crypto = require('crypto');
const { cryptoRSAEncrypt, publicLiteRasKey, publicRasKey } = require('../util');
const { appid, clientver, liteAppid, liteClientver } = require('../util/config.json');

// 平台签名盐值与 RSA 公钥（与 util/helper.js、util/crypto.js 双平台配置保持一致）
const APPKEY_MAP = {
  lite: 'LnT6xpN3khm36zse0QzvmgTZ3waWdRSA',
  standard: 'OIlwieks28dk2k092lksi2UIkp',
};

module.exports = (params, useAxios) => {
  const isLite = process.env.platform === 'lite';
  const token = params?.token || params?.cookie?.token || '';
  const userid = Number(params?.userid || params?.cookie?.userid || 0);
  const mid = params?.mid || params?.cookie?.mid || params?.cookie?.KUGOU_API_MID || '';
  const uuid = params?.uuid || '-';
  const dfid = params?.dfid || params?.cookie?.dfid || '-';
  const type = params?.type || 1;

  // 平台参数（支持 params 覆盖，默认跟随 platform 配置）
  const appId = String(params?.appid || (isLite ? liteAppid : appid));
  const appKey = params?.appkey || APPKEY_MAP[isLite ? 'lite' : 'standard'];
  const clientVer = String(params?.clientver || (isLite ? liteClientver : clientver));
  const publicKey = params?.publicKey || (isLite ? publicLiteRasKey : publicRasKey);

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
