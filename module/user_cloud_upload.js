// 上传音乐文件到用户云盘
// 流程：获取授权 → 初始化分片上传 → 上传分片 → 完成上传 → 添加文件到云盘
// add_files 请求体结构与客户端云盘请求保持一致
const axios = require('axios');
const crypto = require('crypto');
const {
  playlistAesEncrypt,
  playlistAesDecrypt,
  rsaEncrypt2,
  signParamsKey,
  signatureAndroidParams,
  cryptoMd5,
  clientver,
  appid,
} = require('../util');
const { resolveProxy } = require('../util/runtime');
const userCloudMatch = require('./user_cloud_match');

// 计算文件内容的 MD5（crypto-js 的 cryptoMd5 对 Buffer 会执行 JSON 序列化，不能用于文件）
const fileMd5 = (buffer) => crypto.createHash('md5').update(buffer).digest('hex');
const bssVerifyCode = (bucket, requestAppid) => cryptoMd5(`${requestAppid}${bucket}8ae10344e9738dcb`);
const boolParam = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  return !['0', 'false', 'no'].includes(String(value).toLowerCase());
};
const firstCandidate = (item) => (Array.isArray(item) ? item[0] : item);
const normalizeMatch = (candidate) => {
  if (!candidate || typeof candidate !== 'object') return null;
  const audioInfo = candidate.audio_info || {};
  const albumAudioId = Number(candidate.album_audio_id) || 0;
  const audioId = Number(audioInfo.audio_id || candidate.audio_id) || 0;
  const hashStd = audioInfo.hash || candidate.hash || '';
  if (!albumAudioId && !audioId && !hashStd) return null;
  return {
    album_audio_id: albumAudioId,
    audio_id: audioId,
    hash_std: hashStd,
    author_name: candidate.author_name || '',
    audio_name: candidate.ori_audio_name || candidate.audio_name || candidate.songname || '',
    suffix_audio_name: candidate.suffix_audio_name || '',
    raw: candidate,
  };
};
const extractMatch = (body) => {
  if (body?.match) return body.match;
  if (Array.isArray(body?.match_list) && body.match_list.length) return body.match_list[0];
  if (Array.isArray(body?.data) && body.data.length) return normalizeMatch(firstCandidate(body.data[0]));
  return null;
};
const withProtocol = (host) => (/^https?:\/\//i.test(host || '') ? host : `http://${host}`);

module.exports = (params, useAxios) => {
  const answer = { status: 500, body: {}, cookie: [] };
  return new Promise(async (resolve) => {
    try {
      // userid 必须为字符串（p 参数 RSA 加密时服务端校验 uid 类型）
      const userid = String(params?.userid || params?.cookie?.userid || 0);
      const token = params?.token || params?.cookie?.token || '';
      const mid = params?.cookie?.KUGOU_API_MID || params?.mid || '';
      const dfid = params?.cookie?.dfid || params?.dfid || '-';
      const uuid = params?.cookie?.KUGOU_API_GUID || params?.uuid || '-';
      const requestAppid = params?.appid || appid;
      const requestClientver = params?.clientver || clientver;
      const clienttime = Math.floor(Date.now() / 1000);

      // 文件数据（由 HTTP 层接收的二进制 body 传入）
      const fileData = params?.data || Buffer.alloc(0);
      if (!fileData.length) throw new Error('请通过请求体传入文件二进制数据');

      // filename 即文件 MD5（小写），可传入覆盖，默认自动计算
      const filename = String(params?.filename || fileMd5(fileData)).toLowerCase();
      // 扩展名（自动去掉点号）
      const extendname = String(params?.extendname || 'mp3').replace(/^\./, '');
      const bucket = 'musicclound';
      const version = requestClientver;
      let matchInfo = null;
      const needMatch =
        boolParam(params?.auto_match, true) &&
        !(params?.hash_std && params?.audio_id && (params?.album_audio_id || params?.mixid || params?.mix_id));

      if (needMatch) {
        const matchRes = await userCloudMatch(
          {
            ...params,
            data: undefined,
            hash: filename,
            appid: requestAppid,
            clientver: requestClientver,
          },
          useAxios
        );
        if (matchRes?.body?.status === 1) matchInfo = extractMatch(matchRes.body);
      }

      const hashStd = String(params?.hash_std || matchInfo?.hash_std || filename).toLowerCase();
      const audioId = Number(params?.audio_id || matchInfo?.audio_id) || 0;
      const albumAudioId = Number(params?.album_audio_id || params?.mixid || params?.mix_id || matchInfo?.album_audio_id) || 0;
      const author_name = params?.author_name || matchInfo?.author_name || '';
      const trackName = params?.track_name || params?.songname || matchInfo?.audio_name || filename;
      const name = params?.name || `${author_name ? `${author_name} - ` : ''}${trackName}.${extendname}`;

      const signBssParams = (paramsMap) => {
        paramsMap.signature = signatureAndroidParams(paramsMap, '');
        return paramsMap;
      };

      // 原生 axios 请求（步骤 1-4 不需要签名，尽量贴近抓包）
      const http = (options) => {
        const proxyConfig = resolveProxy();
        const headers = {
          'User-Agent': `Android15-1070-${requestClientver}-201-0-wifi`,
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
      const authParams = signBssParams({
        bucket,
        filename,
        method: 'POST',
        loginType: token && userid !== '0' ? 1 : 0,
        buVerifyCode: bssVerifyCode(bucket, requestAppid),
        extranet: 1,
        userid,
        token,
        version,
        dfid,
        mid,
        uuid,
        appid: requestAppid,
        clientver: requestClientver,
        clienttime: Math.floor(Date.now() / 1000),
      });
      const authRes = await http({
        method: 'get',
        url: 'https://gateway.kugou.com/bsstrackercdngz/v1/upload/auth',
        params: authParams,
      });
      const authorization = authRes?.data?.data?.authorization;
      if (!authorization) throw new Error(JSON.stringify(authRes?.data) || '获取授权失败');

      // ========== 步骤2 初始化分片上传 ==========
      const initParams = signBssParams({
        bucket,
        filename,
        ssl: 1,
        extendname,
        version,
        userid,
        token,
        authorization,
        dfid,
        mid,
        uuid,
        appid: requestAppid,
        clientver: requestClientver,
        clienttime: Math.floor(Date.now() / 1000),
      });
      const initRes = await http({
        method: 'post',
        url: 'http://bssulbig.kugou.com/v2/multipart/initiate/music',
        params: initParams,
        headers: { Authorization: authorization },
      });
      const initData = initRes?.data?.data || {};
      const { external_host, upload_id } = initData;
      let bssFileHash = initData['x-bss-filename'] || filename;

      // 秒传分支：upload_id 为空且返回 x-bss-hash 说明文件已在服务器，跳过步骤3/4
      if (upload_id) {
        if (!external_host) throw new Error(JSON.stringify(initRes?.data) || '初始化上传失败');
        // ========== 步骤3 上传分片（默认 1MB 一片） ==========
        const partSize = 1024 * 1024;
        const partCount = Math.max(1, Math.ceil(fileData.length / partSize));
        for (let i = 0; i < partCount; i++) {
          const part = fileData.slice(i * partSize, (i + 1) * partSize);
          const uploadParams = signBssParams({
            bucket,
            authorization,
            filename,
            partnumber: i + 1,
            upload_id,
            body_empty: 1,
            version,
            userid,
            token,
            dfid,
            mid,
            uuid,
            appid: requestAppid,
            clientver: requestClientver,
            clienttime: Math.floor(Date.now() / 1000),
          });
          const uploadRes = await http({
            method: 'post',
            url: `${withProtocol(external_host)}/v3/multipart/upload`,
            params: uploadParams,
            headers: { Authorization: authorization, 'Content-Type': 'application/octet-stream' },
            data: part,
          });
          if (uploadRes?.data?.status !== 1) throw new Error(JSON.stringify(uploadRes?.data) || '分片上传失败');
        }

        // ========== 步骤4 完成上传 ==========
        const completeParams = signBssParams({
          bucket,
          authorization,
          filename,
          partnumber: partCount,
          upload_id,
          md5: filename,
          version,
          userid,
          token,
          if_id3: 1,
          dfid,
          mid,
          uuid,
          appid: requestAppid,
          clientver: requestClientver,
          clienttime: Math.floor(Date.now() / 1000),
        });
        const completeRes = await http({
          method: 'post',
          url: `${withProtocol(external_host)}/v3/multipart/complete`,
          params: completeParams,
          headers: { Authorization: authorization },
        });
        if (completeRes?.data?.status !== 1) throw new Error(JSON.stringify(completeRes?.data) || '完成上传失败');
        bssFileHash = completeRes?.data?.data?.['x-bss-filename'] || bssFileHash;
      }

      // ========== 步骤5 添加文件到云盘（AES 加密 body + RSA 加密密钥） ==========
      // 请求体结构：data 数组（所有字段必需）+ list_ver
      // 数字字段必须为 number 类型（query 传入时为字符串，需转换，否则服务端返回 500）
      const aesEncrypt = playlistAesEncrypt({
        data: [
          {
            name,
            ext: extendname,
            author_name,
            hash: bssFileHash,
            hash_std: hashStd,
            audio_id: audioId,
            bitrate: Number(params?.bitrate) || 4,
            album_audio_id: albumAudioId,
            size: fileData.length,
            timelen: Number(params?.timelen) || 0,
          },
        ],
        list_ver: Number(params?.list_ver) || 0,
      });
      const p = rsaEncrypt2({ aes: aesEncrypt.key, uid: userid, token }).toUpperCase();

      const respone = await useAxios({
        baseURL: 'https://mcloudservice.kugou.com',
        url: '/v1/add_files',
        params: {
          clienttime,
          mid,
          key: signParamsKey(clienttime.toString(), requestAppid, requestClientver),
          clientver: requestClientver,
          appid: requestAppid,
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
        hash: bssFileHash,
        local_hash: filename,
        hash_std: hashStd,
        audio_id: audioId,
        album_audio_id: albumAudioId,
        matched: Boolean(matchInfo),
        filesize: fileData.length,
      };

      resolve(respone);
    } catch (error) {
      console.log(error);
      // useAxios 失败时 reject 的是 { status, body } 结构，body.msg 为 AxiosError，
      // 从中提取上游响应内容（arraybuffer 需转字符串），便于定位酷狗侧的具体错误
      let upstream = error?.body?.msg?.response?.data;
      if (upstream && Buffer.isBuffer(upstream)) upstream = upstream.toString();
      answer.body = {
        status: 0,
        msg: upstream
          ? typeof upstream === 'string'
            ? upstream
            : JSON.stringify(upstream)
          : error?.message || String(error),
        stack: error?.stack,
      };
      resolve(answer);
    }
  });
};
