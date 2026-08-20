const {
  DEFAULT_MUSIC_ROOM_BG,
  GATEWAY_BASE,
  MUSIC_ROOM_BIZ,
  SELF_STUDY_BIZ,
  YOUTH_BASE,
  authBody,
  createDomainHandler,
  parseArray,
  parseObject,
} = require('./_listen_together_common');

const groupOperation = (url) => ({
  baseURL: GATEWAY_BASE,
  url,
  method: 'POST',
  data: (p) => ({
    ...authBody(p),
    biz: p.biz || SELF_STUDY_BIZ,
    groupid: p.groupid || p.room_id || '',
  }),
});

module.exports = createDomainHandler({
  create: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/group/create',
    method: 'POST',
    data: (p) => {
      const biz = String(p.biz || SELF_STUDY_BIZ);
      const roomPrivacy = Number(p.room_privacy ?? (biz === MUSIC_ROOM_BIZ ? 1 : 3));
      const passThroughData = {
        ...parseObject(p.pass_through_data),
        room_privacy: roomPrivacy,
        cp_notice: 1,
      };
      const body = { ...authBody(p), biz, pass_through_data: passThroughData };
      if (biz === MUSIC_ROOM_BIZ) {
        body.introduction = p.introduction || p.room_name || '';
        passThroughData.room_bg_content = JSON.stringify({
          bg_img: p.background_url || DEFAULT_MUSIC_ROOM_BG,
          room_bg_type: String(p.room_bg_type || 2),
        });
        if (roomPrivacy === 1) passThroughData.global_collection_id = p.global_collection_id || '';
        else body.capacity = Number(p.capacity || 5);
      } else {
        const bizDefinedData = parseArray(p.biz_defined_data);
        body.biz_defined_data = bizDefinedData.length
          ? bizDefinedData
          : [{ key: 'lyric_switch', value: 1 }];
      }
      return body;
    },
  },
  join: {
    ...groupOperation('/rmservice/v1/group/join'),
    data: (p) => ({
      ...authBody(p),
      biz: p.biz || SELF_STUDY_BIZ,
      groupid: p.groupid || p.room_id || '',
      pass_through_data: p.pass_through_data || { cp_notice: 1 },
    }),
  },
  state: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/group/info',
    method: 'POST',
    params: (p) => ({ biz: p.biz || SELF_STUDY_BIZ }),
    data: (p) => ({ groupid: p.groupid || p.room_id || '' }),
  },
  heartbeat: groupOperation('/rmservice/v1/group/heartbeat'),
  status: groupOperation('/rmservice/v1/user/get_status'),
  leave: groupOperation('/rmservice/v1/group/leave'),
  dismiss: groupOperation('/rmservice/v1/group/dismiss'),
  update_chat: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/group/update_info',
    method: 'POST',
    data: (p) => ({
      groupid: p.groupid || p.room_id || '',
      biz: MUSIC_ROOM_BIZ,
      switch: { chat: Number(p.chat) === 1 ? 1 : 2 },
    }),
  },
  check_minor: {
    baseURL: YOUTH_BASE,
    url: '/v1/risk/check_minor',
    method: 'GET',
    params: () => ({}),
  },
});
