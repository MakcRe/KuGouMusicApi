// 获取验证码数据
module.exports = (params, useAxios) => {
  const dataMap = {
    eventid: params?.eventid,
    userid: params?.userid || 0,
    platid: params?.platid || 2,
    rtype: 1,
    wasm: 1,
    i: '',
    sid: '',
    edt: '',
  };

  return useAxios({
    url: '/verifyservice/v3/get_verify_info',
    encryptType: 'android',
    method: 'POST',
    data: dataMap,
    cookie: params?.cookie || {},
  });
};
