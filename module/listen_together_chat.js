const {
  GATEWAY_BASE,
  SELF_STUDY_BIZ,
  authBody,
  createDomainHandler,
} = require('./_listen_together_common');

module.exports = createDomainHandler({
  send: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/group/chat',
    method: 'POST',
    data: (p) => ({
      ...authBody(p),
      biz: p.biz || SELF_STUDY_BIZ,
      groupid: p.groupid || p.room_id || '',
      message: {
        msgtype: p.msgtype || 801,
        nickname: p.nickname || '',
        img: p.img || '',
        alert: p.alert || p.message || '',
      },
    }),
  },
  history: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/group/msg_history',
    method: 'POST',
    data: (p) => ({
      ...authBody(p),
      biz: p.biz || SELF_STUDY_BIZ,
      groupid: p.groupid || p.room_id || '',
      maxid: p.maxid || '0',
      pagesize: p.pagesize || '20',
    }),
  },
});
