// 上传图片（用于修改「我的歌单」自定义封面）
// 直连图片上传服务（imgphp.kugou.com/imageupload/stream.php）
// type: 图片类型，自定义歌单封面用 custom
// extendName: 扩展名，默认 .jpg
// file: 上传的文件路径（本地文件），也可通过二进制请求体 data 直接传入图片
// md5: 上传校验值，默认 MD5(日期yyyyMMdd + 盐值)，可省略
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { cryptoMd5 } = require('../util/crypto');
const { resolveProxy } = require('../util/runtime');

// 只允许上传图片：扩展名白名单 + 文件头魔数校验，避免该接口被当作任意文件读取/外传通道。
// 路径本身仍按调用方给的相对/绝对路径解析（行为与之前一致）；如需进一步收紧，可用
// KUGOU_API_UPLOAD_FILE_ROOT 指定唯一可读目录。
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)$/i;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const UPLOAD_FILE_ROOT = process.env.KUGOU_API_UPLOAD_FILE_ROOT ? path.resolve(process.env.KUGOU_API_UPLOAD_FILE_ROOT) : null;

const isImage = (buffer) => {
  if (!buffer || buffer.length < 12) return false;
  const head = buffer.subarray(0, 12).toString('hex').toLowerCase();
  return (
    head.startsWith('89504e47') || // PNG
    head.startsWith('ffd8ff') || // JPEG
    head.startsWith('47494638') || // GIF
    head.startsWith('424d') || // BMP
    (head.startsWith('52494646') && buffer.subarray(8, 12).toString('latin1') === 'WEBP') // WEBP
  );
};

module.exports = (params, useAxios) => {
  return new Promise((resolve, reject) => {
    let image = Buffer.isBuffer(params?.data) ? params.data : null;
    if (!image) {
      const file = params?.file;
      const filePath = typeof file === 'string' && file !== '' ? path.resolve(file) : '';
      const stat = filePath && fs.existsSync(filePath) ? fs.statSync(filePath) : null;
      const allowed =
        stat &&
        stat.isFile() &&
        stat.size > 0 &&
        stat.size <= MAX_IMAGE_BYTES &&
        IMAGE_EXT.test(filePath) &&
        (!UPLOAD_FILE_ROOT || filePath.startsWith(UPLOAD_FILE_ROOT + path.sep));
      if (!allowed) {
        reject({ status: 400, body: { status: 0, msg: '文件不存在或不是有效图片' } });
        return;
      }
      image = fs.readFileSync(filePath);
      if (!isImage(image)) {
        reject({ status: 400, body: { status: 0, msg: '文件不存在或不是有效图片' } });
        return;
      }
    }

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
