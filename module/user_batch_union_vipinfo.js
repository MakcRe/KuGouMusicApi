// 批量查询评论作者的概念版会员产品（KugouYoung YVipInfoMemoryManager）
// POST https://kugouvip.kugou.com/v2/batch_union_vipinfo
// body: { get_type, busi_type, useridlist, clientappid, kugouid, clienttoken }

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && `${value}` !== '');

const toUserIds = (value) => {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,\s]+/)
      : value == null
        ? []
        : [value];
  const ids = [];
  const seen = new Set();
  for (const item of list) {
    const id = Number(item);
    if (!Number.isFinite(id) || id <= 0) continue;
    const key = String(id);
    if (seen.has(key)) continue;
    seen.add(key);
    ids.push(id);
    if (ids.length >= 20) break;
  }
  return ids;
};

module.exports = (params, useAxios) => {
  const cookie = params?.cookie || {};
  const useridlist = toUserIds(firstValue(params.useridlist, params.userids, params.userid_list));
  if (useridlist.length === 0) {
    return Promise.resolve({
      status: 200,
      body: { status: 1, error_code: 0, data: { busi_vip: {} } },
      cookie: [],
      headers: {},
    });
  }

  const kugouid = Number(firstValue(params.kugouid, params.userid, cookie.userid, 0)) || 0;
  const token = `${firstValue(params.clienttoken, params.token, cookie.token) ?? ''}`;
  const dataMap = {
    get_type: `${firstValue(params.get_type, '2')}`,
    busi_type: `${firstValue(params.busi_type, 'concept')}`,
    useridlist,
    clientappid: `${firstValue(params.clientappid, cookie.appid, '')}`,
  };
  if (kugouid > 0) dataMap.kugouid = String(kugouid);
  if (token) dataMap.clienttoken = token;

  return useAxios({
    baseURL: 'https://kugouvip.kugou.com',
    url: '/v2/batch_union_vipinfo',
    method: 'POST',
    encryptType: 'android',
    data: dataMap,
    cookie,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};
