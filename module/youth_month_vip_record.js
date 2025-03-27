// 领取vip 需要登录
module.exports = (params, useAxios) => {


  return useAxios({
    url: '/youth/v1/activity/get_month_vip_record',
    encryptType: 'android',
    method: 'get',

    cookie: params?.cookie,
  });
};
