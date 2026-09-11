// 听歌偏好设置更新（userpreferservice/v1/update_user_conf）。
// body: { plat:1, userid, p, data:{...}, params }
// data 字段：mode/gender/age/lang/style/song_lang/stylerec_taglist/wish_taglist/inactive_taglist/inactive_singerlist
// lang/style 为基础偏好 JSON 字符串（value > 50 视为启用）；
// song_lang 为推荐强度 JSON 字符串（0 屏蔽、50 默认、100 加大）；传空字符串可清除对应字段。
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

  const dataFields = [
    'mode',
    'gender',
    'age',
    'lang',
    'style',
    'song_lang',
    'stylerec_taglist',
    'wish_taglist',
    'inactive_taglist',
    'inactive_singerlist',
  ];
  const hasData = dataFields.some((k) => params[k] != null);
  if (!hasData) {
    return Promise.reject({ status: 400, body: { status: 0, msg: '至少需要提供 gender/age/lang/style 等偏好字段之一' }, cookie: [] });
  }

  // 16 位随机 hex 临时密钥
  const strG2 = crypto.randomBytes(8).toString('hex');

  const body = { plat: 1, userid };
  body.p = rsaEncrypt2(JSON.stringify({ key: strG2, clienttime: String(clienttime) }));
  const data = {};
  for (const k of dataFields) {
    if (params[k] != null) {
      data[k] = typeof params[k] === 'object' ? JSON.stringify(params[k]) : String(params[k]);
    }
  }
  body.data = data;
  body.params = cryptoAesEncrypt(JSON.stringify({ token }), { key: strG2 });

  return useAxios({
    baseURL: 'https://gateway.kugou.com',
    url: '/userpreferservice/v1/update_user_conf',
    method: 'POST',
    params: { appid: appId, clientver: clientVer, clienttime, mid, dfid, uuid },
    data: body,
    clearDefaultParams: true,
    encryptType: 'android',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `Android15-1070-${clientVer}-201-0-update_user_conf-wifi`,
      'KG-Rec': '1',
      'KG-RC': '1',
    },
    cookie: params?.cookie || {},
  });
};
