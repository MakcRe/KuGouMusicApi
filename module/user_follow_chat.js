// 统一私信发送接口（文本/图片/表情）
// 网关：POST https://gateway.kugou.com/v1/chat/send（x-router: msg.mobile.kugou.com）
//
// 参数说明：
//   tuid          目标用户 uid，首次给对方发消息时使用（与 tag 二选一）
//   tag           会话标识，形如 chat:对方uid_自己uid，已有会话回信用（与 tuid 二选一）
//   msgtype       消息类型，默认 201（文本）
//   alert         文本内容，msgtype=201 时必填；图片/表情可省略（自动用 [图片]/[表情]）
//
//   图片（msgtype=202）二选一：
//     a. url 直接传已上传到酷狗 BSS 的图片地址（可选 width/height/is_original/original_size）
//     b. 传本地图片：HTTP 调用时用二进制请求体（Content-Type: application/octet-stream）
//        传入，或 imgFile 传 base64/dataURL 字符串；模块自动走
//        「获取上传授权 → 直传 bssdl 对象存储 → 回填 url」流程后发送
//
//   表情（msgtype=205）：url 与 thumbUrl 必填（平台现成资源，无需上传）
//
//   nickname      发送者昵称，仅展示用，可省略
//   source        发送来源，默认 0；5 为群聊场景，需配合 groupid
//   groupid       群 id，仅 source=5 时需要
//   follow_source 关注来源埋点，默认 0
//   location      位置信息，默认空
//   nt            默认空
//   fakeid        官方助手/机器人会话身份 id，从收到的消息中原样回传
//   source_path   消息入口埋点（客户端会把它从 message 提取为外层 ingress），也可直接传 ingress
//   retry         重发标记，传 true 时请求体携带 retry: 1
//
// 图片上传对应安卓客户端逻辑（fi3/b.java + protocol/m.java + protocol/n.java）：
//   授权接口 bucket=imagemsg，buVerifyCode = md5(appid + bucket + "b8a37aa141c842f9")，
//   文件直传 https://bssulbig.service.kugou.com/v3/upload（body 为文件字节流），
//   最终消息 url = http://{x-bss-bucket}.{bssdl域名}/{x-bss-filename}，
//   发原图(is_original)时下载域名用 bssdlbig.kugou.com。
//
// 陌生人限流：对方未关注且未回复前最多发 3 条打招呼消息（含历史发送），
// 额度内第 3 条起响应带 tip_content 提醒但消息仍送达；超限后 errcode=3006、status=0，消息被拒；
// 对方关注或回复后立即解锁，恢复后响应不再带 tip_content
const crypto = require('crypto');
const axios = require('axios');
const { resolveProxy } = require('../util/runtime');
const { signatureAndroidParams, cryptoMd5, appid, clientver } = require('../util');
const { liteAppid, liteClientver } = require('../util/config.json');

// 聊天图片上传的固定配置（来自安卓客户端 protocol/m.java）
const IMAGE_BUCKET = 'imagemsg';
const IMAGE_BU_VERIFY_KEY = 'b8a37aa141c842f9';
const BSS_AUTH_URL = 'https://encounter.kugou.com/v1/upload/auth';
const BSS_UPLOAD_URL = 'https://bssul.service.kugou.com/v3/upload';
const BSS_DOWNLOAD_HOST = 'bssdl.kugou.com';
const BSS_DOWNLOAD_HOST_BIG = 'bssdlbig.kugou.com';

// 计算文件内容 MD5（Buffer 场景不能用 crypto-js 的 cryptoMd5，它会对 Buffer 做序列化）
const fileMd5 = (buffer) => crypto.createHash('md5').update(buffer).digest('hex');

// base64/dataURL 严格校验后转 Buffer（避免乱码被静默解码成垃圾字节）
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const normalizeBase64 = (input) => {
  const base64 = (input.startsWith('data:') ? input.slice(input.indexOf(',') + 1) : input).replace(/\s/g, '');
  if (base64 === '' || base64.length % 4 !== 0 || !BASE64_RE.test(base64)) return null;
  return Buffer.from(base64, 'base64');
};

// BSS 上传请求签名：与消息发送同款 Android 签名（无请求体时签名串不含 body）
const signBssParams = (paramsMap) => {
  const signed = { ...paramsMap };
  delete signed.signature;
  signed.signature = signatureAndroidParams(signed, '');
  return signed;
};

// 上传图片到 BSS 对象存储，返回消息中可用的图片 url
const uploadImage = async (buffer, ctx) => {
  const filename = fileMd5(buffer);
  const extendname = String(ctx.extendname || 'jpg').replace(/^\./, '');
  const http = (options) => axios({ ...options, ...(ctx.proxy ? { proxy: ctx.proxy } : {}) });
  // 上传通道的 UA 模块名为 UploadImageChatMsg（与发送的 ChatSend 不同）
  const ua = `Android15-AndroidPhone-${ctx.clientverUsed}-201-0-UploadImageChatMsg-wifi`;

  // 步骤1：获取上传授权（encounter 入口 + 网关路由头，与客户端抓包一致）
  const authRes = await http({
    method: 'get',
    url: ctx.bssAuthUrl,
    params: signBssParams({
      bucket: IMAGE_BUCKET,
      // APK 原样：filename 为空字符串（授权不绑定具体文件，直传时也不传 filename）
      filename: '',
      method: 'POST',
      loginType: ctx.token ? 1 : 0,
      buVerifyCode: cryptoMd5(`${ctx.appidUsed}${IMAGE_BUCKET}${IMAGE_BU_VERIFY_KEY}`),
      extranet: 1,
      userid: ctx.userid,
      token: ctx.token,
      version: ctx.clientverUsed,
      dfid: ctx.dfid,
      mid: ctx.mid,
      uuid: ctx.uuid,
      appid: ctx.appidUsed,
      clientver: ctx.clientverUsed,
      clienttime: Math.floor(Date.now() / 1000),
    }),
    headers: { 'x-router': 'bsstrackercdngz.kugou.com', Host: 'gateway.kugou.com' },
  });
  const authorization = authRes?.data?.data?.authorization;
  if (!authorization) {
    throw new Error(`获取上传授权失败: ${JSON.stringify(authRes?.data || {})}`);
  }

  // 步骤2：文件直传（body 为文件字节流，body_empty=1 表示签名不含请求体）
  // 直传参数集与授权接口不同：无 clienttime/uuid/version（对应安卓 n.java q() 的参数表）
  const uploadRes = await http({
    method: 'post',
    url: BSS_UPLOAD_URL,
    params: signBssParams({
      bucket: IMAGE_BUCKET,
      authorization,
      extendname,
      userid: ctx.userid,
      token: ctx.token,
      dfid: ctx.dfid,
      mid: ctx.mid,
      appid: ctx.appidUsed,
      clientver: ctx.clientverUsed,
      body_empty: 1,
    }),
    headers: { Authorization: authorization, 'Content-Type': 'application/octet-stream', 'User-Agent': ua },
    data: buffer,
  });
  if (uploadRes?.data?.status !== 1 || !uploadRes?.data?.data?.['x-bss-filename']) {
    throw new Error(`图片上传失败: ${JSON.stringify(uploadRes?.data || {})}`);
  }
  const { 'x-bss-bucket': bucketName, 'x-bss-filename': bssFilename } = uploadRes.data.data;
  // 发原图走 bssdlbig 下载域名，其余走 bssdl
  const host = ctx.isOriginal ? BSS_DOWNLOAD_HOST_BIG : BSS_DOWNLOAD_HOST;
  return `http://${bucketName}.${host}/${bssFilename}`;
};

module.exports = async (params, useAxios) => {
  const tag = params?.tag || '';
  const tuid = Number(params?.tuid || 0);
  if (!tag && !tuid) {
    return Promise.reject({ status: 502, body: { status: 0, errcode: -1, error: 'tuid 与 tag 至少需要传一个' } });
  }

  const isLite = process.env.platform === 'lite';
  const appidUsed = isLite ? liteAppid : appid;
  const clientverUsed = isLite ? liteClientver : clientver;
  const token = params?.token || params?.cookie?.token || '';
  const userid = String(params?.userid || params?.cookie?.userid || 0);
  const mid = params?.cookie?.KUGOU_API_MID || params?.mid || '';
  const dfid = params?.cookie?.dfid || params?.dfid || '-';
  const uuid = params?.uuid || '-';

  const msgtype = Number(params?.msgtype || 201);
  // message 基础字段：location 缺省时不输出（与客户端抓包一致，org.json 对 null 会移除键）
  const message = {
    msgtype,
    alert: params?.alert || '',
    nickname: params?.nickname || '',
    source: Number(params?.source || 0),
    follow_source: Number(params?.follow_source || 0),
    nt: params?.nt || '',
  };
  if (params?.location) message.location = params.location;
  if (params?.groupid) message.groupid = Number(params.groupid);

  // ========== 按类型补全 message 内容 ==========
  if (msgtype === 202) {
    // 图片：优先使用调用方提供的 url，否则用二进制数据走 BSS 上传
    message.alert = message.alert || '[图片]';
    let url = params?.url || '';
    if (!url) {
      const image = Buffer.isBuffer(params?.data)
        ? params.data
        : typeof params?.imgFile === 'string'
          ? normalizeBase64(params.imgFile)
          : null;
      if (!image || !image.length) {
        return Promise.reject({
          status: 502,
          body: { status: 0, errcode: -1, error: '图片消息需要提供 url，或通过二进制请求体/octet-stream、imgFile(base64/dataURL) 传入图片' },
        });
      }
      try {
        url = await uploadImage(image, {
          userid,
          token,
          mid,
          dfid,
          uuid,
          appidUsed,
          clientverUsed,
          isOriginal: !!(params?.is_original || params?.isOriginal),
          extendname: params?.extendname,
          bssAuthUrl: params?.bss_auth_url || params?.bssAuthUrl || BSS_AUTH_URL,
          proxy: resolveProxy(),
        });
      } catch (e) {
        return Promise.reject({ status: 502, body: { status: 0, errcode: -1, error: e.message } });
      }
    }
    message.url = url;
    if (params?.width) message.width = Number(params.width);
    if (params?.height) message.height = Number(params.height);
    // 字段名为驼峰 isOriginal/originalSize（与安卓 MsgEntity 常量一致），isOriginal 无条件输出
    message.isOriginal = !!(params?.is_original || params?.isOriginal);
    if (message.isOriginal && (params?.original_size || params?.originalSize)) {
      message.originalSize = Number(params?.original_size || params?.originalSize);
    }
  } else if (msgtype === 205) {
    // 表情：平台现成资源，url 与缩略图均为必填
    message.alert = message.alert || '[表情]';
    if (!params?.url || !params?.thumbUrl) {
      return Promise.reject({ status: 502, body: { status: 0, errcode: -1, error: '表情消息需要提供 url 与 thumbUrl' } });
    }
    message.url = String(params.url);
    message.thumbUrl = String(params.thumbUrl);
  } else if (msgtype === 201) {
    if (!message.alert) {
      return Promise.reject({ status: 502, body: { status: 0, errcode: -1, error: '文本消息缺少 alert 内容' } });
    }
  } else {
    // 其余类型（语音/卡片等）透传 url 等字段，由调用方保证结构完整
    if (params?.url) message.url = String(params.url);
    if (params?.thumbUrl) message.thumbUrl = String(params.thumbUrl);
    if (params?.timelen) message.timelen = Number(params.timelen);
    if (!message.alert && !message.url) {
      return Promise.reject({ status: 502, body: { status: 0, errcode: -1, error: `msgtype=${msgtype} 需要提供 alert 或 url` } });
    }
  }

  if (params?.fakeid) message.fakeid = String(params.fakeid);

  const sourcePath = params?.source_path || params?.ingress || '';
  const body = tag ? { tag } : { tuid };
  if (sourcePath) body.ingress = sourcePath;
  if (params?.retry) body.retry = 1;
  body.message = message;

  // 安卓端 org.json 序列化时会把值中的 / 转义为 \/，
  // 实际发送的请求体与参与签名的字节均为转义后的形式
  const data = JSON.stringify(body).split('/').join('\\/');

  return useAxios({
    url: '/v1/chat/send',
    method: 'post',
    data,
    encryptType: 'android',
    cookie: params?.cookie || {},
    // 网关靠 x-router 把请求路由到消息服务，缺失会直接 502（kws Bad Gateway）
    headers: {
      'x-router': 'msg.mobile.kugou.com',
      'User-Agent': `Android15-AndroidPhone-${clientverUsed}-201-0-ChatSend-wifi`,
      'Content-Type': 'text/plain; charset=UTF-8',
    },
  });
};
