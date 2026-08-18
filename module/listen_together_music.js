const {
  GATEWAY_BASE,
  MUSIC_ROOM_BIZ,
  authBody,
  createDomainHandler,
  musicRoomAudios,
  parseArray,
  parseObject,
} = require('./_listen_together_common');

module.exports = createDomainHandler({
  history: {
    baseURL: GATEWAY_BASE,
    url: '/youth/v1/genting/history',
    method: 'GET',
    params: (p) => ({ last_id: Number(p.last_id || 0) }),
  },
  list: {
    baseURL: GATEWAY_BASE,
    url: '/youth/v2/genting/recommend',
    method: 'POST',
    params: (p) => ({
      page: Math.max(0, Number(p.page || 1) - 1),
      pagesize: Number(p.pagesize || 20),
      loop_pick: Number(p.loop_pick || 0),
      tags: p.tags || '',
      room_biz: MUSIC_ROOM_BIZ,
      ...(p.mixsongid ? { mixsongid: p.mixsongid } : {}),
    }),
    data: (p) => ({ data: parseArray(p.behaviors) }),
  },
  detail: {
    baseURL: GATEWAY_BASE,
    url: '/youth/v1/genting/get_musicroom_info',
    method: 'GET',
    params: (p) => ({ roomid: p.roomid || p.room_id || '', biz: p.biz || MUSIC_ROOM_BIZ }),
  },
  members: {
    baseURL: GATEWAY_BASE,
    url: '/rmservice/v1/livestream/members',
    method: 'POST',
    data: (p) => ({
      ...authBody(p),
      biz: p.biz || MUSIC_ROOM_BIZ,
      groupid: p.groupid || p.room_id || '',
    }),
  },
  initialize: {
    baseURL: GATEWAY_BASE,
    url: '/youth/v1/genting/init_musicroom',
    method: 'POST',
    params: (p) => ({ roomid: p.roomid || p.room_id || '' }),
    data: (p) => {
      const body = { sendall: Number(p.sendall ?? 1), audios: musicRoomAudios(p) };
      const progressInfo = parseObject(p.progress_info, null);
      if (progressInfo) body.progress_info = progressInfo;
      return body;
    },
  },
  sync_player: {
    baseURL: GATEWAY_BASE,
    url: '/youth/v1/genting/music_sync_player',
    method: 'POST',
    params: (p) => ({ roomid: p.roomid || p.room_id || '', frm: Number(p.frm || 2) }),
    data: () => ({}),
  },
  switch_song: {
    baseURL: GATEWAY_BASE,
    url: '/youth/v1/genting/music_sw',
    method: 'POST',
    params: (p) => ({ roomid: p.roomid || p.room_id || '' }),
    data: (p) => ({
      act_type: Number(p.act_type || 1),
      list_version: String(p.list_version || ''),
      is_auto: Number(p.is_auto || 0) ? '1' : '0',
      audio: {
        hash: p.hash || '',
        mixsongid: p.mixsongid ?? '',
      },
    }),
  },
  player_operation: {
    baseURL: GATEWAY_BASE,
    url: '/youth/v1/genting/music_player_opr',
    method: 'POST',
    params: (p) => ({ roomid: p.roomid || p.room_id || '' }),
    data: (p) => {
      const action = Number(p.action || 3);
      const body = { action };
      if (action === 1) body.play_mode = Number(p.play_mode || 1);
      if (action === 2) body.progress = Math.max(0, Math.floor(Number(p.progress || 0)));
      if (action === 3) body.pause = Number(p.pause || 2) === 1 ? '1' : '2';
      return body;
    },
  },
  playlist: {
    baseURL: GATEWAY_BASE,
    url: '/youth/v1/genting/music_fetch_list',
    method: 'POST',
    params: (p) => ({ roomid: p.roomid || p.room_id || '' }),
    data: (p) => {
      const body = { pagesize: Number(p.pagesize || 50) };
      const audio = parseObject(p.audio, null);
      if (audio?.hash) {
        body.audio = {
          hash: audio.hash,
          mixsongid: audio.mixsongid ?? audio.mixSongId ?? '',
        };
      }
      return body;
    },
  },
  order_song: {
    baseURL: GATEWAY_BASE,
    url: '/youth/v1/genting/order_song',
    method: 'POST',
    params: (p) => ({ roomid: p.roomid || p.room_id || '' }),
    data: (p) => ({ mixsongid: p.mixsongid ?? '', hash: p.hash || '' }),
  },
  song_order_list: {
    baseURL: GATEWAY_BASE,
    url: '/youth/v1/genting/song_order_list',
    method: 'GET',
    params: (p) => ({ roomid: p.roomid || p.room_id || '' }),
  },
  remove_song: {
    baseURL: GATEWAY_BASE,
    url: '/youth/v1/genting/remove_song',
    method: 'POST',
    params: (p) => ({ roomid: p.roomid || p.room_id || '' }),
    data: (p) => ({
      mixsongid: p.mixsongid ?? '',
      hash: p.hash || '',
      order_userid: String(p.order_userid || ''),
    }),
  },
  music_add: {
    baseURL: GATEWAY_BASE,
    url: '/youth/v1/genting/music_add',
    method: 'POST',
    params: (p) => ({
      roomid: p.roomid || p.room_id || '',
      ...(p.order_userid
        ? { order_userid: String(p.order_userid), source: String(p.source || 1) }
        : {}),
    }),
    data: (p) => {
      const body = {
        action: Number(p.action || 4),
        list_version: String(p.list_version || ''),
        sendall: Number(p.sendall ?? 1),
        audios: musicRoomAudios(p),
      };
      const progressInfo = parseObject(p.progress_info, null);
      if (progressInfo) body.progress_info = progressInfo;
      return body;
    },
  },
});
