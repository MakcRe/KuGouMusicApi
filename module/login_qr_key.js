const { srcappid } = require('../util');
// 二维码 key 生成接口
module.exports = (params, useAxios) => {
  return useAxios({
    baseURL: 'https://login-user.kugou.com',
    url: '/v2/qrcode',
    method: 'GET',
    params: { appid: params?.type === 'web' ? 1014 : 1001, type: 1, plat: 4, qrcode_txt: 'https://h5.kugou.com/apps/loginQRCode/html/index.html?appid=1005&', srcappid },
    encryptType: 'web',
    cookie: params?.cookie || {},
  });
}