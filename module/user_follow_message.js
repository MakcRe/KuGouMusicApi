/**
 * 获取私信会话历史
 *
 * 参数：
 *   id       对方 uid（必填）
 *   pagesize 每页条数，默认 30
 *   maxid    翻页游标，默认 0（从最新开始）
 *
 * 会话 tag 固定为「对方uid_自己uid」的顺序（与 chat/send 响应返回的 tag 一致）
 */
module.exports = (params, useAxios) => {
  const userid = params?.userid || params?.cookie?.userid || '0';

  return useAxios({
    url: '/msg.mobile/v3/msgtag/history',
    encryptType: 'android',
    method: 'GET',
    params: { filter: 1, maxid: params.maxid ?? 0, pagesize: params.pagesize ?? 30, tag: `chat:${params.id}_${userid}`},
    cookie: params?.cookie || {},
  });
};
