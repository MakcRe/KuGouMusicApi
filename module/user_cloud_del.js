// 删除用户云盘音乐
const { playlistAesEncrypt, playlistAesDecrypt, rsaEncrypt2, signParamsKey, clientver, appid } = require('../util');

module.exports = (params, useAxios) => {
  const answer = { status: 500, body: {}, cookie: [] };
  return new Promise(async (resolve) => {
    try {
      const userid = String(params?.userid || params?.cookie?.userid || 0);
      const token = params?.token || params?.cookie?.token || '';
      const mid = params?.cookie?.KUGOU_API_MID;
      const requestAppid = params?.appid || appid;
      const requestClientver = params?.clientver || clientver;
      const clienttime = Math.floor(Date.now() / 1000);

      const fileids = []
        .concat(params?.fileids || params?.fileid || params?.kv_ids || params?.kv_id || [])
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim())
        .filter(Boolean);
      const albumAudioIds = []
        .concat(params?.album_audio_ids || params?.album_audio_id || [])
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim())
        .filter(Boolean);
      const hashes = []
        .concat(params?.hashes || params?.hash || params?.filename || [])
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim())
        .filter(Boolean);

      if (!fileids.length && !hashes.length) throw new Error('请传入 fileid、kv_id、hash 或 hashes');

      const dataMap = fileids.length
        ? {
            data: fileids.map((id, index) => ({
              kv_id: Number(id) || id,
              album_audio_id: Number(albumAudioIds[index] || albumAudioIds[0] || params?.mixid || params?.mix_id || 0),
            })),
          }
        : { data: hashes };

      const aesEncrypt = playlistAesEncrypt(dataMap);
      const p = rsaEncrypt2({ aes: aesEncrypt.key, uid: userid, token }).toUpperCase();

      const respone = await useAxios({
        baseURL: 'https://mcloudservice.kugou.com',
        url: '/v1/del_files',
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

      try {
        respone.body = playlistAesDecrypt({ str: respone.body.toString('base64'), key: aesEncrypt.key });
      } catch (e) {
        try {
          respone.body = JSON.parse(respone.body.toString());
        } catch (e2) {
          respone.body = respone.body.toString();
        }
      }

      resolve(respone);
    } catch (error) {
      console.log(error);
      let upstream = error?.body?.msg?.response?.data;
      if (upstream && Buffer.isBuffer(upstream)) upstream = upstream.toString();
      answer.body = {
        status: 0,
        msg: upstream
          ? typeof upstream === 'string'
            ? upstream
            : JSON.stringify(upstream)
          : error?.body?.msg?.message || error?.message || String(error),
      };
      resolve(answer);
    }
  });
};
