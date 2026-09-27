// 获取访客列表（模块路由 /user/visitors）
// 接口：POST http://usercenter.kugou.com/v2/get_visitors
// 对应概念版 com.kugou.common.userCenter.protocol.v（协议类）+ protocol.a（基类）
const crypto = require('crypto');
const { cryptoMd5, signatureAndroidParams, publicRasKey, publicLiteRasKey } = require('../util');

const SALT = { 1005: 'OIlwieks28dk2k092lksi2UIkp', 3116: 'LnT6xpN3khm36zse0QzvmgTZ3waWdRSA' };
const PUBLIC_KEY = { 1005: publicRasKey, 3116: publicLiteRasKey };
const DEFAULT_CLIENTVER = { 1005: 20809, 3116: 10672 };

module.exports = (params, useAxios) => {
  const isLite = process.env.platform === 'lite';
  const appidUsed = Number(params?.appid || (isLite ? 3116 : 1005));
  const clientverUsed = Number(params?.clientver || DEFAULT_CLIENTVER[appidUsed]);
  const publicKey = params?.rsaPublicKey || PUBLIC_KEY[appidUsed] || publicRasKey;
  const token = params?.token || params?.cookie?.token || '';
  const userid = Number(params?.userid || params?.cookie?.userid || 0);
  const mid = String(params?.mid || params?.cookie?.KUGOU_API_MID || '');
  const dfid = params?.dfid || params?.cookie?.dfid || '-';
  const uuid = params?.uuid || '-';
  // t_userid：要查看的访客归属用户，默认查自己；p 明文里同样携带
  const tUserid = Number(params?.t_userid || params?.visit_userid || userid);
  const clienttime = Math.floor(Date.now() / 1000);

  const pPlain = `{"clienttime":${clienttime},"token":"${token}","t_userid":${tUserid}}`;
  const buf = Buffer.alloc(128);
  buf.write(pPlain, 0, 'utf8');
  const p = crypto.publicEncrypt({ key: publicKey, padding: crypto.constants.RSA_NO_PADDING }, buf).toString('hex').toUpperCase();

  const data = {
    userid,
    t_userid: tUserid,
    p,
    page: Number(params?.page || 1),
  };
  if (params?.busi_type) data.busi_type = params.busi_type;

  const query = {
    dfid,
    plat: '1',
    clienttime: String(clienttime),
    mid,
    uuid,
    clientver: String(clientverUsed),
    appid: String(appidUsed),
  };
  const s = Object.keys(query).sort().map((k) => `${k}=${query[k]}`).join('');
  query.signature = cryptoMd5(`${SALT[appidUsed] || SALT[1005]}${s}${JSON.stringify(data)}${SALT[appidUsed] || SALT[1005]}`);

  return useAxios({
    baseURL: 'http://usercenter.kugou.com',
    url: '/v2/get_visitors',
    method: 'POST',
    data,
    params: query,
    clearDefaultParams: true,
    notSignature: true,
    cookie: params?.cookie || {},
    headers: {
      'Content-Type': 'text/plain; charset=ISO-8859-1',
      'User-Agent': `Android15-1070-${clientverUsed}-201-0-User-wifi`,
      'KG-RC': '1',
      'KG-Rec': '1',
      'KG-THash': '3980f3c',
      // 设备风控头：如服务端开启强校验，可从 params 传入抓包值
      ...(params?.kg_devid ? { 'KG-DEVID': params.kg_devid } : {}),
      ...(params?.kg_clienttimems ? { 'KG-CLIENTTIMEMS': params.kg_clienttimems } : {}),
    },
  });
};
