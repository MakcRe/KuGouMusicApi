// CSCC lite 播放上报；由播放器在真实播放开始/结束时调用。
const crypto = require('crypto');
const zlib = require('zlib');
const { isIP } = require('net');
const { publicLiteRasKey } = require('../util');
const gradeInfo = require('./user_grade_info');

const APPKEY = 'LnT6xpN3khm36zse0QzvmgTZ3waWdRSA';
const VERSION = '10597';
const sessions = new Map();
const md5 = (value) => crypto.createHash('md5').update(value).digest('hex');
const fail = (status, msg) => ({ status, body: { status: 0, msg }, cookie: [], headers: {} });
const clean = (value) => typeof value === 'string' && value.length > 0 && !/[&\t\r\n]/.test(value);
const integer = (value) => /^(0|[1-9]\d*)$/.test(String(value)) && Number.isSafeInteger(Number(value));

module.exports = async (params = {}, useAxios) => {
  const cookie = params.cookie || {};
  const uuid = params.uuid || cookie.uuid || cookie.KUGOU_API_GUID;
  const mid = String(params.mid || cookie.mid || cookie.KUGOU_API_MID || '');
  const userid = String(params.userid || cookie.userid || '');
  const token = params.token || cookie.token;
  const song = String(params.mixsongid || '');
  const event = params.event;
  const state = params.state || '完整播放';
  const sync = params.d_sec != null || params.diff_sec != null;
  // 默认设备名称复用 dev；系统和屏幕参数兼容参考报文，IP 未提供时使用 0.0.0.0。
  const deviceModel = params.device_model ?? params.dev ?? (cookie.KUGOU_API_DEV || process.env.KUGOU_API_DEV || 'KuGouMusicApi');
  const systemVersion = String(params.system_version ?? '9');
  const screenWidth = params.screen_width ?? 1920;
  const screenHeight = params.screen_height ?? 1080;
  const localIp = params.local_ip ?? '0.0.0.0';
  if (!clean(deviceModel) || deviceModel.length > 128 || /[\x00-\x1f\x7f]/.test(deviceModel) ||
      !/^\d+(?:\.\d+)*$/.test(systemVersion) || systemVersion.length > 16 ||
      !integer(screenWidth) || Number(screenWidth) < 1 || Number(screenWidth) > 65535 ||
      !integer(screenHeight) || Number(screenHeight) < 1 || Number(screenHeight) > 65535 ||
      typeof localIp !== 'string' || !isIP(localIp)) {
    throw fail(400, '设备参数无效：需要有效机型、系统版本、正整数屏幕尺寸及 IPv4/IPv6 local_ip');
  }
  if (!clean(uuid) || !/^[a-zA-Z0-9]{32}$/.test(uuid) || !clean(mid) || !integer(userid) || Number(userid) <= 0 || !token) {
    throw fail(400, '需要 token、userid、mid 和 32 位字母数字 uuid（也可从 cookie 读取）');
  }
  if (!integer(song) || Number(song) <= 0 || !['start', 'end'].includes(event)) {
    throw fail(400, '需要有效 mixsongid 和 event=start|end');
  }
  if (event === 'end' && (!integer(params.duration) || !clean(state))) {
    throw fail(400, '结束事件需要非负整数 duration（实际播放毫秒数）和有效 state');
  }
  if (sync && (event !== 'end' || !integer(params.d_sec) || !integer(params.diff_sec) || Number(params.diff_sec) > Math.ceil(Number(params.duration) / 1000))) {
    throw fail(400, '等级同步仅支持结束事件，需提供 d_sec、diff_sec（秒），增量不得超过本次播放时长');
  }
  const request = async (url, method, query, data, kind) => {
    const eventDetails = url === '/v2/post'
      ? { event, mixsongid: song, ...(event === 'end' ? { duration: Number(params.duration), state } : {}) }
      : {};
    let response;
    try {
      response = await useAxios({
        baseURL: 'http://d.kugou.com', url, method, params: query, data,
        clearDefaultParams: true, clearDefaultHeaders: true, notSignature: true, cookie,
        headers: {
          ...(method === 'POST' ? { 'Content-Type': 'application/octet-stream' } : {}),
          ...(url !== '/v3/qrydid' ? {
            'KG-Rec': '1',
            'User-Agent': `Android${systemVersion}-1070-${VERSION}-18-0-Cscc${kind}-wifi`,
          } : {}),
        },
      });
    } catch (error) {
      // 仅保留安全诊断字段，不透出 Axios config 中的 cookie、签名或密文。
      const body = error?.body;
      const cause = body?.msg;
      const upstream = cause?.response?.data;
      const details = {};
      // HTTP 200 的业务拒绝由 request.js 抛出 body；HTTP 错误则在 Axios response.data。
      for (const source of [upstream, body]) {
        if (!source || typeof source !== 'object') continue;
        for (const key of ['errcode', 'error_code', 'code', 'message', 'errmsg', 'error', 'reason', 'msg']) {
          const value = source[key];
          if (typeof value === 'string' || typeof value === 'number') details[key] = value;
        }
      }
      const message = details.msg || details.message || details.errmsg || details.error ||
        details.reason || cause?.message || error?.message || 'CSCC request failed';
      throw {
        ...fail(502, message),
        body: {
          ...details,
          status: 0,
          msg: message,
          stage: url,
          ...eventDetails,
          ...(cause?.response?.status != null ? { upstream_status: cause.response.status } : {}),
          ...(cause?.code ? { network_error_code: cause.code } : {}),
        },
      };
    }
    const body = response.body;
    if (response.status !== 200 || body?.status === 0 || (body?.errcode != null && String(body.errcode) !== '0') || (body?.error_code != null && String(body.error_code) !== '0')) {
      throw { ...response, status: 502, body: { ...body, stage: url, ...eventDetails } };
    }
    return response;
  };
  const cacheKey = md5(JSON.stringify([uuid, mid, userid, token, deviceModel, systemVersion, Number(screenWidth), Number(screenHeight)]));
  // 按账号和设备隔离，同时合并并发建会话请求；限制闲置会话占用。
  for (const [key, entry] of sessions) if (entry.expires <= Date.now()) sessions.delete(key);
  if (!sessions.has(cacheKey)) {
    if (sessions.size >= 256) sessions.delete(sessions.keys().next().value);
    const pending = (async () => {
      let _t = String(Math.floor(Date.now() / 1000));
      const data = JSON.stringify({ machine: deviceModel, mid, uuid, wh: [Number(screenWidth), Number(screenHeight)] });
      const device = await request('/v3/qrydid', 'POST', {
        appid: 'and02', _t, sign: md5(`_t${_t}appidand02pbKC7zn{4U*ydo2M1Rir${data}`),
      }, data, 'Gen');
      const deviceid = device.body?.data?.deviceid;
      if (!deviceid) throw fail(502, 'CSCC 未返回 deviceid');
      const field2 = crypto.randomBytes(16).toString('hex');
      const s = crypto.publicEncrypt({ key: publicLiteRasKey, padding: crypto.constants.RSA_PKCS1_PADDING },
        Buffer.from(`${uuid}\t${field2}\t${Date.now()}\t${deviceid}`)).toString('base64');
      _t = String(Math.floor(Date.now() / 1000));
      const response = await request('/v2/gen', 'GET', { s, appid: '3116', _t, sign: md5(`_t${_t}appid3116s${s}${APPKEY}`) }, undefined, 'Gen');
      try {
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(field2), Buffer.from(uuid.slice(0, 16)));
        const session = JSON.parse(Buffer.concat([decipher.update(Buffer.from(response.body.data, 'base64')), decipher.final()]).toString());
        if (!session.cookie || session.clienttime == null || !session.serverstr) throw new Error('Invalid session');
        return { ...session, field2 };
      } catch (_) {
        throw fail(502, 'CSCC 会话响应无效');
      }
    })();
    sessions.set(cacheKey, { pending, expires: Date.now() + 30 * 60 * 1000 });
  }
  let report;
  let playbackAccepted = false;
  try {
    const session = await sessions.get(cacheKey).pending;
    const fields = event === 'start'
      ? ['type_id=20431', 'action=play', 'fo3=3878,4320,4326,5747,5749,7229,7289,7863', 'spt=0', 'sty=手动', `mixsongid=${song}`, 'source=46', 'ivar1=1', 'fo=/专辑播放页']
      : ['type_id=4', 'action=play', 'fo3=3878,4320,4326,5747,5749,7229,7289,7863', `duration=${params.duration}`, 'svar3=0', 'svar2=0', 'fo=我的音乐/主态/自建歌单/RU', 'sty=手动', `state=${state}`, `mixsongid=${song}`, 'source=46', 'ivar3=0', 'type=1', 'fs=1.0', 'ivar1=1'];
    fields.push( `mid=${mid}`, `uuid=${uuid}`, 'ss1=1', 'ss2=1', `sys=${systemVersion}`, `mod=${deviceModel}`, 'channelid=18', `ip=${localIp}`, 'net=1', `ver=${VERSION}`, 'gitversion=7aa8a76', `time=${Date.now()}`, `userid=${userid}`, `ss3=${md5(crypto.randomUUID())}`);
    const eventBuffer = Buffer.from(fields.join('&'));
    const line1 = ['4', '1', uuid, '0', '3116', VERSION, '18', systemVersion, deviceModel, uuid, mid, '0', '000000000000000000000000000000000000'].join('\t');
    const line2 = [eventBuffer.length, '10048', '0', Math.floor(Date.now() / 1000), '1', userid, '0', '0'].join('\t');
    const plain = Buffer.concat([Buffer.from(`${line1}\r\n${line2}\r\n`), zlib.deflateSync(eventBuffer)]);
    const key = md5(uuid + session.clienttime + session.field2 + session.serverstr);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(uuid.slice(0, 16)));
    const encrypted = Buffer.concat([cipher.update(zlib.deflateSync(plain)), cipher.final()]);
    const query = { cookie: session.cookie, length: String(plain.length), appid: '3116', _t: String(Math.floor(Date.now() / 1000)) };
    const sorted = Object.keys(query).sort().map((key) => key + query[key]).join('');
    query.sign = md5(Buffer.concat([Buffer.from(sorted + APPKEY), encrypted]));
    report = await request('/v2/post', 'POST', query, encrypted, 'Post');
    playbackAccepted = true;
  } catch (error) {
    sessions.delete(cacheKey);
    // 不重试事件：超时也可能已记账，避免重复上报。
    if (!sync) throw error;
    report = error?.body ? error : fail(502, 'CSCC request failed');
  }
  if (!sync) return report;
  let grade;
  let gradeSynced = false;
  try {
    grade = await gradeInfo({ ...params, uuid, mid, userid, token }, useAxios);
    gradeSynced = grade.status === 200 && Boolean(grade.body) && Number(grade.body.status ?? 1) !== 0 &&
      Number(grade.body?.error_code ?? grade.body?.errcode ?? 0) === 0;
  } catch (error) {
    // 不把 Axios Error/config 带回 IPC，避免暴露认证参数。
    const body = error?.body || {};
    grade = fail(502, typeof body.msg === 'string' ? body.msg : body.msg?.message || 'Grade sync failed');
    for (const key of ['error_code', 'errcode', 'message']) {
      if (typeof body[key] === 'string' || typeof body[key] === 'number') grade.body[key] = body[key];
    }
  }
  // 两步独立执行，不自动重试；成功响应只代表请求被接受，不代表时长即时入账。
  const accepted = playbackAccepted || gradeSynced;
  const result = {
    status: accepted ? 200 : 502,
    cookie: [...(report.cookie || []), ...(grade.cookie || [])],
    headers: { ...(report.headers || {}), ...(grade.headers || {}) },
    body: { status: accepted ? 1 : 0, data: {
      report: report.body, grade: grade.body,
      playback_accepted: playbackAccepted, grade_synced: gradeSynced,
    } },
  };
  if (!accepted) throw result;
  return result;
};
