// 上传音乐文件到用户云盘
// 流程：获取授权 → 初始化分片上传 → 上传分片 → 完成上传 → 添加文件到云盘
// add_files 请求体结构来自 APK 逆向（com.kugou.android.musiccloud.a.a）
const axios = require('axios');
const crypto = require('crypto');
const { playlistAesEncrypt, playlistAesDecrypt, rsaEncrypt2, signParamsKey, clientver, appid } = require('../util');
const { resolveProxy } = require('../util/runtime');

// 计算文件内容的 MD5（crypto-js 的 cryptoMd5 对 Buffer 会执行 JSON 序列化，不能用于文件）
const fileMd5 = (buffer) => crypto.createHash('md5').update(buffer).digest('hex');

module.exports = (params, useAxios) => {
  const answer = { status: 500, body: {}, cookie: [] };
  return new Promise(async (resolve) => {
    try {
      // userid 必须为字符串（p 参数 RSA 加密时服务端校验 uid 类型）
      const userid = String(params?.userid || params?.cookie?.userid || 0);
      const token = params?.token || params?.cookie?.token || '';
      const mid = params?.cookie?.KUGOU_API_MID;
      const clienttime = Math.floor(Date.now() / 1000);

      // 文件数据（由 HTTP 层接收的二进制 body 传入）
      const fileData = params?.data || Buffer.alloc(0);
      if (!fileData.length) throw new Error('请通过请求体传入文件二进制数据');

      // filename 即文件 MD5（小写），可传入覆盖，默认自动计算
      const filename = String(params?.filename || fileMd5(fileData)).toLowerCase();
      // 扩展名（自动去掉点号）
      const extendname = String(params?.extendname || 'mp3').replace(/^\./, '');
      // 歌手名与显示名称
      const author_name = params?.author_name || '';
      const name = params?.name || `${author_name ? `${author_name} - ` : ''}${filename}.${extendname}`;
      const bucket = 'musicclound';
      const version = clientver;

      // 原生 axios 请求（步骤 1-4 不需要签名，尽量贴近抓包）
      const http = (options) => {
        const proxyConfig = resolveProxy();
        const headers = {
          'User-Agent': 'Android15-1070-10672-201-0-wifi',
          'KG-RC': '1',
          'KG-Rec': '1',
          // 每次请求生成随机的 KG-THash（模拟客户端行为，固定 7 位 hex）
          'KG-THash': Math.floor(Math.random() * 0xfffffff)
            .toString(16)
            .padStart(7, '0'),
          ...(options.headers || {}),
        };
        return axios({ ...options, headers, ...(proxyConfig ? { proxy: proxyConfig } : {}) });
      };

      // ========== 步骤1 获取上传授权 ==========
      const authRes = await http({
        method: 'get',
        url: 'http://bssulbig.kugou.com/v2/authorization',
        params: { version, userid, filename, token, appid, method: 'POST', bucket },
      });
      const authorization = authRes?.data?.data?.authorization;
      if (!authorization) throw new Error(JSON.stringify(authRes?.data) || '获取授权失败');

      // ========== 步骤2 初始化分片上传 ==========
      const initRes = await http({
        method: 'post',
        url: 'http://bssulbig.kugou.com/multipart/initiate/music',
        params: { version, extendname, userid, filename, appid, bucket },
        headers: { Authorization: authorization },
      });
      const { external_host, upload_id } = initRes?.data?.data || {};

      // 秒传分支：upload_id 为空且返回 x-bss-hash 说明文件已在服务器，跳过步骤3/4
      if (upload_id) {
        // ========== 步骤3 上传分片（默认 4MB 一片） ==========
        const partSize = 1024 * 1024 * 4;
        const partCount = Math.max(1, Math.ceil(fileData.length / partSize));
        for (let i = 0; i < partCount; i++) {
          const part = fileData.slice(i * partSize, (i + 1) * partSize);
          const uploadRes = await http({
            method: 'post',
            url: `http://${external_host}/multipart/upload`,
            params: { version, userid, filename, appid, upload_id, partnumber: i + 1, bucket },
            headers: { Authorization: authorization, 'Content-Type': 'application/octet-stream' },
            data: part,
          });
          if (uploadRes?.data?.status !== 1) throw new Error(JSON.stringify(uploadRes?.data) || '分片上传失败');
        }

        // ========== 步骤4 完成上传 ==========
        const completeRes = await http({
          method: 'post',
          url: `http://${external_host}/multipart/complete`,
          params: { filename, bucket, if_id3: 1, upload_id, userid, md5: filename, version, appid, partnumber: partCount },
          headers: { Authorization: authorization },
        });
        if (completeRes?.data?.status !== 1) throw new Error(JSON.stringify(completeRes?.data) || '完成上传失败');
      }

      // ========== 步骤5 添加文件到云盘（AES 加密 body + RSA 加密密钥） ==========
      // 请求体结构来自 APK：data 数组（所有字段必需）+ list_ver
      const aesEncrypt = playlistAesEncrypt({
        data: [
          {
            name,
            ext: extendname,
            author_name,
            hash: filename,
            hash_std: filename,
            audio_id: params?.audio_id ?? 0,
            bitrate: params?.bitrate ?? 4,
            album_audio_id: params?.album_audio_id ?? 0,
            size: fileData.length,
            timelen: params?.timelen ?? 0,
          },
        ],
        list_ver: params?.list_ver ?? 0,
      });
      const p = rsaEncrypt2({ aes: aesEncrypt.key, uid: userid, token }).toUpperCase();

      const respone = await useAxios({
        baseURL: 'https://mcloudservice.kugou.com',
        url: '/v1/add_files',
        params: {
          clienttime,
          mid,
          key: signParamsKey(clienttime.toString(), appid),
          clientver,
          appid,
          p,
        },
        data: Buffer.from(aesEncrypt.str, 'base64'),
        method: 'post',
        encryptType: 'android',
        responseType: 'arraybuffer',
        cookie: params?.cookie || {},
        clearDefaultParams: true,
        notSignature: true,
      });

      // 尝试解密响应，失败则按明文 JSON 处理（如服务端返回错误信息）
      try {
        respone.body = playlistAesDecrypt({ str: respone.body.toString('base64'), key: aesEncrypt.key });
      } catch (e) {
        try {
          respone.body = JSON.parse(respone.body.toString());
        } catch (e2) {
          respone.body = respone.body.toString();
        }
      }

      // 附加整个上传流程的关键信息，便于排查
      respone.body.uploadInfo = {
        authorization,
        external_host,
        upload_id,
        hash: filename,
        filesize: fileData.length,
      };

      resolve(respone);
    } catch (error) {
      console.log(error);
      answer.body = {
        status: 0,
        msg: error?.message || String(error),
        stack: error?.stack,
      };
      resolve(answer);
    }
  });
};
