// 修改个人资料（昵称 / 性别 / 头像 / 生日 / 签名 / 地区 / 标签）
//
// 该接口不走 gateway 网关，使用 user 服务的独立鉴权方式：
//   - 不需要 signature 签名，改用 body 里的 key + p 两个字段
//   - key = signParamsKey(clienttime, appid, clientver)
//   - p   = RSA/ECB/NOPADDING({clienttime, token}) 的大写 hex
//   - 所有参数都在 POST body 中，query 为空
//
// 仅需登录 token，不需要账号密码。中文直接传 UTF-8 即可。
const { cryptoRSAEncrypt, signParamsKey } = require('../util');
const { appid, clientver, liteAppid, liteClientver } = require('../util/config.json');

// signature / tags / birthday 允许传空串来清空；其余字段的空值会被忽略
const NULLABLE_FIELDS = ['signature', 'tags', 'birthday'];
const FIELDS = ['nickname', 'sex', 'birthday', 'photo', 'province', 'city', 'memo', 'signature', 'tags'];

module.exports = (params, useAxios) => {
  const isLite = process.env.platform === 'lite';
  const useAppid = isLite ? liteAppid : appid;
  const useClientver = isLite ? liteClientver : clientver;

  const token = params?.token || params?.cookie?.token || '';
  const userid = Number(params?.userid || params?.cookie?.userid || 0);
  const mid = `${params?.mid || params?.cookie?.KUGOU_API_MID || ''}`;
  const clienttime = Math.floor(Date.now() / 1000);

  const data = {};
  for (const key of FIELDS) {
    const val = params?.[key];
    if (val === undefined || val === null) continue;
    if (`${val}` === '' && !NULLABLE_FIELDS.includes(key)) continue;
    data[key] = `${val}`;
  }

  if (Object.keys(data).length === 0) {
    return Promise.reject({ status: 400, body: { status: 0, msg: '至少需要提供一个待修改字段' }, cookie: [] });
  }

  const dataMap = {
    clienttime,
    appid: useAppid,
    clientver: useClientver,
    mid,
    uuid: '-',
    userid,
    key: signParamsKey(clienttime, useAppid, useClientver),
    p: cryptoRSAEncrypt(JSON.stringify({ clienttime, token })).toUpperCase(),
    data,
  };

  return useAxios({
    baseURL: 'http://update.user.kugou.com',
    url: '/v1/update_userinfo',
    method: 'POST',
    data: dataMap,
    cookie: params?.cookie || {},
    clearDefaultParams: true, // 该接口不接受网关默认参数（dfid / signature 等）
    notSignature: true,
  });
};
