// 听歌偏好设置查询（userpreferservice/v1/get_user_conf）。
// body: { plat:1, userid, p, params }，加密与签名由项目基元自动完成。
// query 仅含标准参数集：appid/clientver/clienttime/mid/dfid/uuid，不含 token。
const crypto = require('crypto');
const { cryptoAesEncrypt, rsaEncrypt2 } = require('../util');
const { appid, clientver, liteAppid, liteClientver } = require('../util/config.json');

module.exports = (params = {}, useAxios) => {
  const token = params?.token || params?.cookie?.token || '';
  const userid = Number(params?.userid || params?.cookie?.userid || 0);
  const mid = params?.mid || params?.cookie?.mid || params?.cookie?.KUGOU_API_MID || '-';
  const uuid = params?.uuid || params?.cookie?.uuid || params?.cookie?.KUGOU_API_GUID || '-';
  const dfid = params?.dfid || params?.cookie?.dfid || '-';
  const isLite = process.env.platform === 'lite';
  const appId = isLite ? liteAppid : appid;
  const clientVer = isLite ? liteClientver : clientver;
  const clienttime = Math.floor(Date.now() / 1000);

  // 16 位随机 hex 临时密钥
  const strG2 = crypto.randomBytes(8).toString('hex');

  const body = { plat: 1, userid };
  body.p = rsaEncrypt2(JSON.stringify({ key: strG2, clienttime: String(clienttime) }));
  body.params = cryptoAesEncrypt(JSON.stringify({ token }), { key: strG2 });

  return useAxios({
    baseURL: 'https://gateway.kugou.com',
    url: '/userpreferservice/v1/get_user_conf',
    method: 'POST',
    params: { appid: appId, clientver: clientVer, clienttime, mid, dfid, uuid },
    data: body,
    clearDefaultParams: true,
    encryptType: 'android',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `Android15-1070-${clientVer}-201-0-get_user_conf-wifi`,
      'KG-Rec': '1',
      'KG-RC': '1',
    },
    cookie: params?.cookie || {},
  });
};
