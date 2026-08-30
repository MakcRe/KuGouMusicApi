// 修改头像
//
// 头像不是直传，分两步：
//   1. multipart 上传图片到图床 imgphp.kugou.com，拿到 FileName
//   2. 把 FileName 作为 photo 字段调 /v1/update_userinfo 落库
//
// 图床的 md5 字段是防盗链校验，算法为 md5(yyyyMMdd + 固定盐)，日期取当天。
// 最终头像 URL 为 http://c1.kgimg.com/v2/kugouicon/<FileName>。
// 注意头像为异步审核制，写入成功不代表立即生效。
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const { resolveProxy } = require('../util/runtime');
const userUpdate = require('./user_update');

const UPLOAD_URL = 'http://imgphp.kugou.com/imageupload/post.php';
const UPLOAD_SALT = 'hewry678WEK23D';
const ICON_BASE_URL = 'http://c1.kgimg.com/v2/kugouicon/';

// md5(yyyyMMdd + 盐)，取小写 hex
const uploadToken = (date = new Date()) => {
  const ymd = `${date.getFullYear()}${`${date.getMonth() + 1}`.padStart(2, '0')}${`${date.getDate()}`.padStart(2, '0')}`;
  return crypto.createHash('md5').update(`${ymd}${UPLOAD_SALT}`).digest('hex');
};

// 支持 Buffer / base64 字符串 / dataURL 三种入参。
// Buffer.from(str, 'base64') 对非法字符是静默忽略而非抛错，因此必须先做严格校验，
// 否则任意乱码都会被"解码"成垃圾字节上传，触发头像审核。
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
// 常见图片格式magic bytes：JPEG / PNG / GIF / BMP / WEBP
const isImage = (buf) =>
  (buf[0] === 0xff && buf[1] === 0xd8) ||
  (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) ||
  (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) ||
  (buf[0] === 0x42 && buf[1] === 0x4d) ||
  (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP');

const normalizeImage = (input) => {
  if (Buffer.isBuffer(input)) return isImage(input) ? input : null;
  if (typeof input !== 'string' || input === '') return null;
  const base64 = (input.startsWith('data:') ? input.slice(input.indexOf(',') + 1) : input).replace(/\s/g, '');
  if (base64 === '' || base64.length % 4 !== 0 || !BASE64_RE.test(base64)) return null;
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length < 4 || !isImage(buffer)) return null;
  return buffer;
};

module.exports = async (params, useAxios) => {
  const image = normalizeImage(params?.imgFile ?? params?.img ?? params?.file);
  if (!image) {
    return Promise.reject({
      status: 400,
      body: { status: 0, msg: '图片数据无效（imgFile 需为 Buffer / base64 / dataURL，且为 JPEG/PNG/GIF/BMP/WEBP 格式）' },
      cookie: [],
    });
  }

  const form = new FormData();
  form.append('type', 'kugouicon');
  form.append('md5', uploadToken());
  form.append('file', image, { filename: params?.filename || 'avatar.jpg' });

  let fileName = '';
  try {
    const proxyConfig = resolveProxy();
    const response = await axios.post(UPLOAD_URL, form, {
      headers: form.getHeaders(),
      ...(proxyConfig ? { proxy: proxyConfig } : {}),
    });
    const body = response.data || {};
    fileName = Array.isArray(body.FileName) ? body.FileName[0] : '';
    if (!body.IsSuccess || !fileName) {
      const msg = (Array.isArray(body.Message) && body.Message[0]) || '图床上传失败';
      return Promise.reject({ status: 502, body: { status: 0, msg }, cookie: [] });
    }
  } catch (e) {
    return Promise.reject({ status: 502, body: { status: 0, msg: e.message }, cookie: [] });
  }

  // 第二步：把图床返回的文件名写进 photo 字段
  const result = await userUpdate({ ...params, photo: fileName }, useAxios);
  result.body = Object.assign({}, result.body, { photo: fileName, pic: `${ICON_BASE_URL}${fileName}` });
  return result;
};
