/**
 * 概念版会员结构查询（网关 v1 版，含成长体系 svip_level/svip_score）
 *
 * 对应概念版客户端会员信息接口：
 *   POST https://gateway.kugou.com/kugouvip/v1/batch_union_vipinfo
 *   body: {"product_type":"svip","busi_type":"concept","useridlist":[...],"get_type":3}
 *
 * 与 `/user/batch/union/vipinfo`（v2，直连 kugouvip.kugou.com）的区别：
 * - v1 走网关（路径前缀 kugouvip），URL 侧用 kugouid + clienttoken 而非 userid + token
 * - 响应为数组形态：main_vip_list[] / busi_vip_list[]（v2 为 userid→结构 map）
 * - main_vip_list 条目多出概念版成长体系字段：svip_level / svip_score（试用账号为 0）
 * - 请求体可带 product_type 过滤 busi_vip_list（svip/tvip/wvip）
 *
 * @param {number[]|string} [params.useridlist] - 用户 ID 列表（数组或逗号分隔串，默认本人）
 * @param {string} [params.product_type] - busi_vip_list 过滤类型，默认 'svip'；传空串返回全部
 * @param {string} [params.busi_type] - 业务类型，默认 'concept'
 * @param {number} [params.get_type] - 默认 3
 * @param {string} [params.kugouid] - 当前账号 kugouid（默认取 cookie.userid）
 * @param {string} [params.clienttoken] - 客户端 token（默认取 cookie.token）
 * @param {Object} params.cookie - 登录态
 * @returns {Promise<{status: number, body: Object}>}
 */
const { discoveryCards, srcappid, signatureConceptAndroidParams } = require('../util');
const { CONCEPT_APPID, CONCEPT_CLIENTVER } = discoveryCards;

const toUserIds = (value) => {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,\s]+/)
      : value == null
        ? []
        : [value];
  return list.map(Number).filter((id) => Number.isFinite(id) && id > 0).slice(0, 20);
};

module.exports = (params, useAxios) => {
  const cookie = params?.cookie || {};
  const userid = `${params?.userid || cookie?.userid || ''}`;
  const token = `${params?.clienttoken || params?.token || cookie?.token || ''}`;
  const kugouid = `${params?.kugouid || userid}`;
  const mid = `${params?.mid || cookie?.KUGOU_API_MID || cookie?.mid || ''}`;
  const dfid = `${params?.dfid || cookie?.dfid || '-'}`;
  const clienttime = Math.floor(Date.now() / 1000);

  const useridlist = toUserIds(params?.useridlist ?? userid);
  if (useridlist.length === 0) {
    return Promise.reject({
      status: 502,
      body: { status: 0, error_code: 1, error: 'useridlist 为空：请传入用户 ID 或携带含 userid 的 cookie' },
    });
  }

  const data = {
    product_type: `${params?.product_type ?? 'svip'}`,
    busi_type: `${params?.busi_type ?? 'concept'}`,
    useridlist,
    get_type: Number(params?.get_type ?? 3),
  };

  const query = {
    appid: CONCEPT_APPID,
    clientver: CONCEPT_CLIENTVER,
    mid,
    uuid: '-',
    dfid,
    kugouid,
    clienttoken: token,
    clientappid: CONCEPT_APPID,
    srcappid,
    clienttime,
  };
  query.signature = signatureConceptAndroidParams(query, JSON.stringify(data));

  return useAxios({
    url: '/kugouvip/v1/batch_union_vipinfo',
    method: 'POST',
    data,
    params: query,
    clearDefaultParams: true,
    cookie,
    headers: {
      'User-Agent': `Android16-1070-${CONCEPT_CLIENTVER}-130-0-mobileCallProtocol-wifi`,
      'Content-Type': 'application/json',
      'KG-FAKE': kugouid,
    },
  });
};
