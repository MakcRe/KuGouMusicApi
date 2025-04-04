// 领取vip(领取一天) 需要登录
module.exports = (params, useAxios) => {
  return useAxios({
    url: '/youth/v1/recharge/receive_vip_listen_song',
    encryptType: 'android',
    method: 'post',
    params: { source_id: 90137 },
    cookie: params?.cookie,
  });
};
