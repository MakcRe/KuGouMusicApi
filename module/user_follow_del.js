// 取消关注用户（模块路由 /user/follow/del）
// 接口：POST https://gateway.kugou.com/v1/unfollow（x-router: relationuser.kugou.com）
//
// 参数：
//   tuid    目标用户 id（必填，兼容 t_userid）
//   source  来源埋点，默认 0
const { cryptoRSAEncrypt, signParamsKey, appid, clientver } = require('../util');
const { liteAppid, liteClientver } = require('../util/config.json');

module.exports = (params, useAxios) => {
  const tuid = Number(params?.tuid || params?.t_userid || 0);
  if (!tuid) {
    return Promise.reject({ status: 502, body: { status: 0, error_code: -1, error: '缺少目标用户 tuid' } });
  }
  const isLite = process.env.platform === 'lite';
  const appidUsed = isLite ? liteAppid : appid;
  const clientverUsed = isLite ? liteClientver : clientver;
  const token = params?.token || params?.cookie?.token || '';
  const userid = Number(params?.userid || params?.cookie?.userid || 0);
  const mid = String(params?.mid || params?.cookie?.KUGOU_API_MID || '');
  const dfid = params?.dfid || params?.cookie?.dfid || '-';
  const clienttime = Math.floor(Date.now() / 1000);

  const data = {
    userid,
    source: Number(params?.source || 0),
    clienttime,
    mid,
    key: signParamsKey(String(clienttime), appidUsed, clientverUsed),
    dfid,
    clientver: clientverUsed,
    appid: appidUsed,
    p: cryptoRSAEncrypt({ clienttime, token, t_userid: tuid }).toUpperCase(),
  };

  return useAxios({
    url: '/v1/unfollow',
    method: 'POST',
    data,
    params: { dfid },
    // 老协议：query 只带 dfid，不注入默认参数也不参与网关签名（鉴权在 body 的 key/p）
    clearDefaultParams: true,
    notSignature: true,
    cookie: params?.cookie || {},
    headers: {
      'x-router': 'relationuser.kugou.com',
      'User-Agent': `Android15-AndroidPhone-${clientverUsed}-201-0-User-wifi`,
      'Content-Type': 'text/plain; charset=ISO-8859-1',
      'KG-FAKE': String(userid),
      'KG-FAKE-TYPE': '0,0',
      'KG-FAKE-SUBTYPE': '0,0',
      'KG-RFB': '0',
    },
  });
};
