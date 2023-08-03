// 手机验证码发送
module.exports = (params, useAxios) => {
  
  const dataMap = {
    businessid: 5,
    mobile: params?.mobile,
    plat: 3
  };


  return useAxios({
    url: '/v7/send_mobile_code',
    method: 'POST',
    data: dataMap,
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: { 'x-router': 'loginservice.kugou.com' },
  });
}