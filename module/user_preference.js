// 获取用户的听歌偏好设置（性别、年龄段、语言、风格、推荐模式等）。
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
