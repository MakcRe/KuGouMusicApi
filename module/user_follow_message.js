/**
 * 获取私信会话历史
 *
 * 参数：
 *   tag      会话标识，直接指定。官方系统会话（如账号安全小助手）为 mchat:官方uid，
 *            普通会话为 chat:对方uid_自己uid（传 tag 时忽略 id）
 *   id       对方 uid，不传 tag 时按普通会话构造 chat:id_自己
 *   pagesize 每页条数，默认 30
 *   maxid    翻页游标，默认 0（从最新开始）
 */
module.exports = (params, useAxios) => {
  const userid = params?.userid || params?.cookie?.userid || '0';
  const tag = params?.tag || `chat:${params.id}_${userid}`;
  if (tag === 'chat:undefined_0') {
    return Promise.reject({ status: 502, body: { status: 0, errcode: -1, error: '需要提供 tag（如 mchat:1270119904）或对方 id' } });
  }

  return useAxios({
    url: '/msg.mobile/v3/msgtag/history',
    encryptType: 'android',
    method: 'GET',
    params: { filter: 1, maxid: params.maxid ?? 0, pagesize: params.pagesize ?? 30, tag },
    cookie: params?.cookie || {},
  });
};
