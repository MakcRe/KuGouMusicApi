// 云盘上传前曲库匹配
const crypto = require('crypto');
const { signParamsKey, appid, clientver } = require('../util');

const fileMd5 = (buffer) => crypto.createHash('md5').update(buffer).digest('hex');

const splitList = (value) =>
  []
    .concat(value || [])
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);

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
    hash: hashStd,
    author_name: candidate.author_name || '',
    audio_name: candidate.ori_audio_name || candidate.audio_name || candidate.songname || '',
    suffix_audio_name: candidate.suffix_audio_name || '',
    album_info: candidate.album_info || null,
    raw: candidate,
  };
};

module.exports = (params, useAxios) => {
  const answer = { status: 500, body: {}, cookie: [] };
  return new Promise(async (resolve) => {
    try {
      const requestAppid = params?.appid || appid;
      const requestClientver = params?.clientver || clientver;
      const clienttime = Math.floor(Date.now() / 1000);
      const hashes = splitList(params?.hash || params?.filename);
      if (!hashes.length && params?.data?.length) hashes.push(fileMd5(params.data).toLowerCase());
      if (!hashes.length) throw new Error('请传入 hash，或通过请求体传入文件二进制数据');

      const albumAudioIds = splitList(params?.album_audio_ids || params?.album_audio_id || params?.mixid || params?.mix_id);
      const data = hashes.map((hash, index) => {
        const item = { hash: String(hash).toLowerCase() };
        const albumAudioId = albumAudioIds[index] || albumAudioIds[0];
        if (Number(albumAudioId) > 0) item.album_audio_id = String(albumAudioId);
        return item;
      });

      const dataMap = {
        appid: requestAppid,
        clienttime,
        clientver: requestClientver,
        data,
        dfid: params?.cookie?.dfid || params?.dfid || '-',
        key: signParamsKey(clienttime.toString(), requestAppid, requestClientver),
        mid: params?.cookie?.KUGOU_API_MID || params?.mid || '',
        show_privilege: 0,
        show_author_alias: 0,
        show_rel_album_audio_info: 0,
        show_remarks: 0,
      };

      const respone = await useAxios({
        baseURL: 'http://kmr.service.kugou.com',
        url: '/v2/album_audio/audio',
        method: 'POST',
        data: dataMap,
        encryptType: 'android',
        cookie: params?.cookie || {},
        clearDefaultParams: true,
        notSignature: true,
        headers: { 'x-router': 'kmr.service.kugou.com', 'Content-Type': 'application/json' },
      });

      if (respone?.body?.status === 1 && Array.isArray(respone.body.data)) {
        respone.body.match_list = respone.body.data.map((item) => normalizeMatch(firstCandidate(item))).filter(Boolean);
        respone.body.match = respone.body.match_list[0] || null;
      }

      resolve(respone);
    } catch (error) {
      console.log(error);
      answer.body = {
        status: 0,
        msg: error?.body?.msg?.message || error?.message || String(error),
      };
      resolve(answer);
    }
  });
};
