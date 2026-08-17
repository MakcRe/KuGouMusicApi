// 一起听（音乐室/众乐房）API
// 注意：需要 platform=lite（概念版）模式 + 概念版登录态

const YOUTH_BASE = 'https://youth.kugou.com';
const GATEWAY_BASE = 'https://gateway.kugou.com';

// 登录态注入（rmservice 接口 body 需要 userid/token，userid 需为数字）
const authBody = (p) => ({
  userid: Number(p?.userid || p?.cookie?.userid || 0),
  token: p?.token || p?.cookie?.token || '',
});

const ACTIONS = {
  // ========== 查询类（youth.kugou.com） ==========
  // 房间列表（按标签）
  room_list: {
    baseURL: YOUTH_BASE,
    url: '/v1/room/get_room_list_by_tag',
    method: 'GET',
    params: (p) => ({
      page: p?.page || 1,
      pagesize: p?.pagesize || 20,
      sort: p?.sort || 0,
      page_id: p?.page_id || '',
      ppage_id: p?.ppage_id || '',
      tag_id: p?.tag_id || '',
    }),
  },
  // 房间详情
  room_detail: {
    baseURL: YOUTH_BASE,
    url: '/v1/room/get_room_detail',
    method: 'GET',
    params: (p) => ({ room_id: p?.room_id || '' }),
  },
  // 房间成员列表（需登录；member_type=1 在线成员 / 2 全部成员）
  member_list: {
    baseURL: YOUTH_BASE,
    url: '/v1/room/get_member_list',
    method: 'GET',
    params: (p) => ({
      room_id: p?.room_id || '',
      page: p?.page || 1,
      pagesize: p?.pagesize || 20,
      member_type: p?.member_type || 1,
    }),
  },
  // 酷群广场
  kugroup_square: {
    baseURL: YOUTH_BASE,
    url: '/v1/kugroup/square',
    method: 'GET',
    params: (p) => ({ page: p?.page || 1, pagesize: p?.pagesize || 20, order_type: p?.order_type || 1 }),
  },
  // 歌厅广场
  genting_square: {
    baseURL: YOUTH_BASE,
    url: '/v1/genting/square',
    method: 'GET',
    params: (p) => ({ page: p?.page || 1, pagesize: p?.pagesize || 20, order_type: p?.order_type || 1 }),
  },
  // 酷群主播列表
  kugroup_streamer_list: {
    baseURL: YOUTH_BASE,
    url: '/v1/kugroup/get_streamer_list',
    method: 'GET',
    params: (p) => ({ longitude: p?.longitude || 0, latitude: p?.latitude || 0 }),
  },
  // 歌厅主播列表
  genting_streamer_list: {
    baseURL: YOUTH_BASE,
    url: '/v1/genting/get_streamer_list',
    method: 'GET',
    params: (p) => ({ page: p?.page || 1, pagesize: p?.pagesize || 20 }),
  },
  // 用户最近房间动态（需登录）
  recent_room_dynamic: {
    baseURL: YOUTH_BASE,
    url: '/v3/user/recent_room_dynamic',
    method: 'GET',
    params: () => ({}),
  },
  // 特权详情（需登录）
  privilege: {
    baseURL: YOUTH_BASE,
    url: '/v1/privilege/operate',
    method: 'GET',
    params: (p) => ({ event_type: p?.event_type || 4 }),
  },
  // 歌厅推荐（需登录，concepts 域名）
  genting_recommend: {
    baseURL: 'https://concepts.kugou.com',
    url: '/v1/genting/recommend',
    method: 'POST',
    params: (p) => ({ page: p?.page || 1, pagesize: p?.pagesize || 20, room_biz: p?.room_biz || 1006 }),
  },

  // ========== 房间生命周期（gateway.kugou.com/rmservice） ==========
  // 创建房间（biz=1000 学习房体系；userid 需为数字）
  create: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/group/create',
    method: 'POST',
    data: (p) => ({
      userid: Number(p?.userid || p?.cookie?.userid || 0),
      token: p?.token || p?.cookie?.token || '',
      biz: p?.biz || '1000',
      biz_defined_data: p?.biz_defined_data || [{ key: 'lyric_switch', value: 1 }],
      pass_through_data: p?.pass_through_data || { room_privacy: p?.room_privacy ?? 3, cp_notice: 1 },
    }),
  },
  // 加入房间（需先登录；pass_through_data 含 cp_notice）
  join: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/group/join',
    method: 'POST',
    data: (p) => ({
      ...authBody(p),
      biz: p?.biz || '1000',
      groupid: p?.groupid || p?.room_id || '',
      pass_through_data: p?.pass_through_data || { cp_notice: 1 },
    }),
  },
  // 房间心跳（60s 间隔）
  heartbeat: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/group/heartbeat',
    method: 'POST',
    data: (p) => ({
      ...authBody(p),
      biz: p?.biz || '1000',
      groupid: p?.groupid || p?.room_id || '',
    }),
  },
  // 用户房间状态
  get_status: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/user/get_status',
    method: 'POST',
    data: (p) => ({
      ...authBody(p),
      biz: p?.biz || '1000',
      groupid: p?.groupid || p?.room_id || '',
    }),
  },
  // 离开房间
  leave: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/group/leave',
    method: 'POST',
    data: (p) => ({
      ...authBody(p),
      biz: p?.biz || '1000',
      groupid: p?.groupid || p?.room_id || '',
    }),
  },
  // 解散房间（仅房主）
  dismiss: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/group/dismiss',
    method: 'POST',
    data: (p) => ({
      ...authBody(p),
      biz: p?.biz || '1000',
      groupid: p?.groupid || p?.room_id || '',
    }),
  },

  // ========== 聊天（gateway.kugou.com/rmservice） ==========
  // 发送消息（需先 join；msgtype=801 文本消息）
  send_msg: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/group/chat',
    method: 'POST',
    data: (p) => ({
      ...authBody(p),
      biz: p?.biz || '1000',
      groupid: p?.groupid || p?.room_id || '',
      message: {
        msgtype: p?.msgtype || 801,
        nickname: p?.nickname || '',
        img: p?.img || '',
        alert: p?.alert || p?.message || '',
      },
    }),
  },
  // 历史消息（maxid=0 取最新）
  msg_history: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/group/msg_history',
    method: 'POST',
    data: (p) => ({
      ...authBody(p),
      biz: p?.biz || '1000',
      groupid: p?.groupid || p?.room_id || '',
      maxid: p?.maxid || '0',
      pagesize: p?.pagesize || '20',
    }),
  },

  // ========== 播放（youth.kugou.com） ==========
  // 播放同步（获取当前播放进度；body 需 userid/token）
  sync_player: {
    baseURL: YOUTH_BASE,
    url: '/v1/music/sync_player',
    method: 'POST',
    params: (p) => ({ page_id: p?.page_id || 711586122, ppage_id: p?.ppage_id || '356753938' }),
    data: (p) => ({
      roomid: p?.roomid || p?.room_id || '',
      frm: p?.frm || 2,
      userid: Number(p?.userid || p?.cookie?.userid || 0),
      token: p?.token || p?.cookie?.token || '',
    }),
  },
  // 播放列表（房间歌单；body 需 userid/token，否则 51002）
  fetch_list: {
    baseURL: YOUTH_BASE,
    url: '/v1/music/fetch_list',
    method: 'POST',
    params: (p) => ({ page_id: p?.page_id || 711586122, ppage_id: p?.ppage_id || '356753938' }),
    data: (p) => ({
      roomid: p?.roomid || p?.room_id || '',
      frm: p?.frm || 2,
      pagesize: p?.pagesize || 50,
      userid: Number(p?.userid || p?.cookie?.userid || 0),
      token: p?.token || p?.cookie?.token || '',
    }),
  },
  // 点歌/播放命令（返回歌曲播放 URL）
  reqcmd: {
    baseURL: YOUTH_BASE,
    url: '/v1/music/reqcmd',
    method: 'POST',
    params: (p) => ({ page_id: 191708212, ppage_id: '356753938' }),
    data: (p) => ({
      userid: Number(p?.userid || p?.cookie?.userid || 0),
      token: p?.token || p?.cookie?.token || '',
      roomid: p?.roomid || p?.room_id || '',
      audio: { hash: p?.hash || '', mixsongid: Number(p?.mixsongid || 0) },
    }),
  },

  // ========== 频道 / 房间创建（youth.kugou.com） ==========
  // 频道搜索（拿 global_collection_id）
  channel_search: {
    baseURL: YOUTH_BASE,
    url: '/v1/search/channel',
    method: 'GET',
    params: (p) => ({
      keyword: p?.keyword || '',
      page: p?.page || 1,
      position: p?.position || 1,
    }),
  },
  // 未成年人检测（make_room 前置，必须通过）
  check_minor: {
    baseURL: YOUTH_BASE,
    url: '/v1/risk/check_minor',
    method: 'GET',
    params: () => ({}),
  },
  // 提交房间配置（核心；music_type=1 必须同时传 music_style+audios，否则 20003）
  make_room: {
    baseURL: YOUTH_BASE,
    url: '/v1/user/make_room',
    method: 'POST',
    params: (p) => {
      const pageIdMap = { 1: 711586122, 2: 971343961, 3: 711357575 };
      return {
        page_id: p?.page_id || pageIdMap[p?.music_type] || 711586122,
        ppage_id: p?.ppage_id || '356753938',
        type: p?.type ?? 1,
      };
    },
    data: (p) => {
      const body = {
        room_id: p?.room_id || '',
        room_name: p?.room_name || '',
        global_collection_id: p?.global_collection_id || '',
        room_notice: p?.room_notice || '',
        allow_chat: p?.allow_chat ?? 1,
        room_tag: p?.room_tag || '2',
        music_type: p?.music_type || 1,
      };
      if (body.music_type === 1 || body.music_type === 2) {
        if (p?.music_style) body.music_style = p.music_style;
        if (p?.audios) body.audios = p.audios;
      } else if (body.music_type === 3) {
        body.white_noise_type = p?.white_noise_type || 1;
      }
      return body;
    },
  },
};

module.exports = (params, useAxios) => {
  const action = params?.action || 'room_list';
  const conf = ACTIONS[action];
  if (!conf) {
    return Promise.reject({
      status: 502,
      body: { status: 0, msg: `未知 action: ${action}，可选: ${Object.keys(ACTIONS).join(', ')}` },
    });
  }

  const options = {
    baseURL: conf.baseURL || YOUTH_BASE,
    url: conf.url,
    method: conf.method,
    encryptType: 'android',
    cookie: params?.cookie || {},
  };

  if (conf.params) {
    options.params = conf.params(params);
  }
  if (conf.method !== 'GET') {
    options.data = conf.data ? conf.data(params) : {};
  }

  return useAxios(options);
};
