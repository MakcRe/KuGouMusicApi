// 听歌等级查询与时长同步，统一使用 lite v2 协议。
// d_sec 为服务端累计基线，diff_sec 为本次真实新增秒数。
const crypto = require('crypto');
const { cryptoRSAEncrypt, publicLiteRasKey } = require('../util');

// 构建 v2 上报/查询请求（lite 客户端，原有实现）
const buildV2 = (params, useAxios, cfg) => {
  const token = params?.token || params?.cookie?.token || '';
  const userid = Number(params?.userid || params?.cookie?.userid || 0);
  const mid = params?.mid || params?.cookie?.mid || params?.cookie?.KUGOU_API_MID || '';
  const uuid = params?.uuid || params?.cookie?.uuid || params?.cookie?.KUGOU_API_GUID || '-';
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

module.exports = (params = {}, useAxios) => buildV2(params, useAxios, {
  appId: '3116',
  appKey: 'LnT6xpN3khm36zse0QzvmgTZ3waWdRSA',
  clientVer: '10597',
  publicKey: publicLiteRasKey,
});
