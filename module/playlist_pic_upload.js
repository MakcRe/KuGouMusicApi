// 上传图片（用于修改「我的歌单」自定义封面）
// 直连图片上传服务（imgphp.kugou.com/imageupload/stream.php）
// type: 图片类型，自定义歌单封面用 custom
// extendName: 扩展名，默认 .jpg
// file: 上传的文件路径（本地文件），也可通过二进制请求体 data 直接传入图片
// md5: 上传校验值，默认 MD5(日期yyyyMMdd + 盐值)，可省略
const axios = require('axios');
const fs = require('fs');
const { cryptoMd5 } = require('../util/crypto');
const { resolveProxy } = require('../util/runtime');

module.exports = (params, useAxios) => {
  return new Promise((resolve, reject) => {
    const filePath = params?.file;
    if (!Buffer.isBuffer(params?.data) && (!filePath || !fs.existsSync(filePath))) {
      reject({ body: { status: 0, msg: '文件不存在' } });
      return;
    }

    const image = Buffer.isBuffer(params?.data) ? params.data : fs.readFileSync(filePath);

    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    const queryParams = {
      type: params?.type || 'custom',
      extendName: params?.extendName || '.jpg',
      md5: params?.md5 || cryptoMd5(`${dateStr}hewry678WEK23D`),
      jsonResponse: 1,
    };

    const requestOptions = {
      method: 'post',
      baseURL: 'http://imgphp.kugou.com/imageupload',
      url: '/stream.php',
      params: queryParams,
      data: image,
      headers: { 'Content-Type': 'application/octet-stream' },
      timeout: 30000,
    };

    const proxyConfig = resolveProxy();
    if (proxyConfig) {
      requestOptions.proxy = proxyConfig;
    }

    axios(requestOptions)
      .then((response) => {
        const body = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        if (body?.IsSuccess) {
          resolve({ status: 200, body: { status: 1, FileName: body.FileName } });
        } else {
          resolve({ status: 502, body: { status: 0, msg: body?.Message || '上传失败' } });
        }
      })
      .catch((err) => {
        reject({ status: 502, body: { status: 0, msg: err.message } });
      });
  });
};
