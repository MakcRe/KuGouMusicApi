const { srcappid, appid, liteAppid } = require('../util');
const isLite = process.env.platform === 'lite';

// 二维码 key 生成接口
module.exports = (params, useAxios) => {
  return useAxios({
    baseURL: 'https://login-user.kugou.com',
    url: '/v2/qrcode',
    method: 'GET',
    params: { appid: params?.type === 'web' ? 1014 : 1001, type: 1, plat: 4, qrcode_txt: `https://h5.kugou.com/apps/loginQRCode/html/index.html?appid=${isLite ? liteAppid : appid}&`, srcappid },
    encryptType: 'web',
    cookie: params?.cookie || {},
  });
}