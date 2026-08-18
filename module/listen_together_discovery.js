const {
  YOUTH_BASE,
  createDomainHandler,
} = require('./_listen_together_common');

module.exports = createDomainHandler({
  channel_search: {
    baseURL: YOUTH_BASE,
    url: '/v1/search/channel',
    method: 'GET',
    params: (p) => ({ keyword: p.keyword || '', page: p.page || 1, position: p.position || 1 }),
  },
  kugroup_square: {
    baseURL: YOUTH_BASE,
    url: '/v1/kugroup/square',
    method: 'GET',
    params: (p) => ({ page: p.page || 1, pagesize: p.pagesize || 20, order_type: p.order_type || 1 }),
  },
  genting_square: {
    baseURL: YOUTH_BASE,
    url: '/v1/genting/square',
    method: 'GET',
    params: (p) => ({ page: p.page || 1, pagesize: p.pagesize || 20, order_type: p.order_type || 1 }),
  },
  kugroup_streamers: {
    baseURL: YOUTH_BASE,
    url: '/v1/kugroup/get_streamer_list',
    method: 'GET',
    params: (p) => ({ longitude: p.longitude || 0, latitude: p.latitude || 0 }),
  },
  genting_streamers: {
    baseURL: YOUTH_BASE,
    url: '/v1/genting/get_streamer_list',
    method: 'GET',
    params: (p) => ({ page: p.page || 1, pagesize: p.pagesize || 20 }),
  },
  recent_rooms: {
    baseURL: YOUTH_BASE,
    url: '/v3/user/recent_room_dynamic',
    method: 'GET',
    params: () => ({}),
  },
  privilege: {
    baseURL: YOUTH_BASE,
    url: '/v1/privilege/operate',
    method: 'GET',
    params: (p) => ({ event_type: p.event_type || 4 }),
  },
  genting_recommend: {
    baseURL: 'https://concepts.kugou.com',
    url: '/v1/genting/recommend',
    method: 'POST',
    params: (p) => ({ page: p.page || 1, pagesize: p.pagesize || 20, room_biz: p.room_biz || 1006 }),
  },
});
