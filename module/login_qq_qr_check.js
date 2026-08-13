// QQ 扫码登录 - 检测扫码状态
const axios = require('axios');
const { cryptoAesDecrypt, cryptoAesEncrypt, cryptoRSAEncrypt, qq_appid, qq_lite_appid, isLite, resolveProxy } = require('../util');

const proxy = resolveProxy() || false;

let liteT2Key = 'fd14b35e3f81af3817a20ae7adae7020';
let liteT2Iv = '17a20ae7adae7020';
let liteT1Key = '5e4ef500e9597fe004bd09a46d8add98';
let liteT1Iv = '04bd09a46d8add98';

const cookieToString = (cookie) => {
  if (typeof cookie === 'string') return cookie;
  if (cookie && typeof cookie === 'object') {
    return Object.entries(cookie)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
  return '';
};

module.exports = (params, useAxios) => {
  const answer = { status: 500, body: {}, cookie: [] };
  return new Promise(async (resolve, reject) => {
    try {
      const qrsig = params?.qrsig || '';
      const ptqrtoken = params?.ptqrtoken || '';
      const pt_login_sig = params?.pt_login_sig || '';
      const pt_openlogin_data = params?.pt_openlogin_data || '';
      const xlogin_url = params?.xlogin_url || '';

      let cookie = cookieToString(params?.cookie);
      if (pt_login_sig && !cookie.includes('pt_login_sig')) {
        cookie = `${cookie ? cookie + '; ' : ''}pt_login_sig=${pt_login_sig}`;
      }

      const missing = [];
      if (!qrsig) missing.push('qrsig');
      if (!ptqrtoken) missing.push('ptqrtoken');
      if (!pt_login_sig) missing.push('pt_login_sig');
      if (!pt_openlogin_data) missing.push('pt_openlogin_data');
      if (!xlogin_url) missing.push('xlogin_url');
      if (!cookie || !cookie.includes('qrsig=')) missing.push('cookie');

      if (missing.length > 0) {
        answer.status = 502;
        answer.body = { status: 0, msg: `缺少 ${missing.join('、')}（请先调用 /login/qq/qr/create，并将返回字段原样传入 check 接口）` };
        reject(answer);
        return;
      }

      const clientId = isLite ? qq_lite_appid : qq_appid;
      const sUrl = 'http://connect.qq.com';
      const u1 = encodeURIComponent(sUrl);
      const pollUrl = `https://xui.ptlogin2.qq.com/ssl/ptqrlogin?u1=${u1}&from_ui=1&type=1&ptlang=2052&ptqrtoken=${ptqrtoken}&daid=381&aid=716027609&pt_3rd_aid=${clientId}&pt_openlogin_data=${pt_openlogin_data}&device=2&ptopt=1&pt_uistyle=35&jsver=v1.36.0&login_sig=${encodeURIComponent(
        pt_login_sig
      )}&r=${Math.random()}`;

      const pollResp = await axios({
        url: pollUrl,
        method: 'GET',
        proxy,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          Referer: xlogin_url || 'https://xui.ptlogin2.qq.com/',
          Cookie: cookie,
        },
      });

      const pollSetCookies = pollResp.headers?.['set-cookie'] || [];
      pollSetCookies.forEach((c) => {
        const kv = c.split(';')[0];
        const idx = kv.indexOf('=');
        if (idx > 0 && !cookie.includes(kv.slice(0, idx))) {
          cookie = `${cookie ? cookie + '; ' : ''}${kv}`;
        }
      });

      const body = String(pollResp.data);
      const match = body.match(/ptuiCB\((.+)\)/);
      if (!match) {
        answer.status = 502;
        answer.body = { status: 0, msg: 'ptqrlogin 响应解析失败', data: body.slice(0, 200) };
        reject(answer);
        return;
      }

      const parts = match[1].match(/'([^']*)'/g).map((p) => p.slice(1, -1));
      const code = parts[0];
      const url = parts[2];
      const msg = parts[4];

      if (code === '66') {
        answer.status = 200;
        answer.body = { status: 'wait', qrsig, ptqrtoken, msg: '等待扫码' };
        resolve(answer);
        return;
      }

      if (code === '65') {
        answer.status = 200;
        answer.body = { status: 'expired', qrsig, ptqrtoken, msg: '二维码已失效，请重新生成' };
        resolve(answer);
        return;
      }

      if (code === '0') {
        let openid = url.match(/openid=([^&#]+)/)?.[1] || '';
        let access_token = url.match(/access_token=([^&#]+)/)?.[1] || '';

        if (!openid || !access_token) {
          let sigCookie = cookie;
          let sigUrl = url.startsWith('http') ? url : `https://${url}`;
          for (let hop = 0; hop < 10; hop++) {
            try {
              const sigResp = await axios({
                url: sigUrl,
                method: 'GET',
                proxy,
                maxRedirects: 0,
                validateStatus: (s) => s >= 200 && s < 400,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                  'Accept-Language': 'zh-CN,zh;q=0.9',
                  Referer: xlogin_url || 'https://xui.ptlogin2.qq.com/',
                  'Sec-Fetch-Dest': 'document',
                  'Sec-Fetch-Mode': 'navigate',
                  'Sec-Fetch-Site': 'cross-site',
                  Cookie: sigCookie,
                },
              });
              const loc = sigResp.headers?.location;
              const currentUrl = sigUrl;
              openid = currentUrl.match(/openid=([^&#]+)/)?.[1] || '';
              access_token = currentUrl.match(/access_token=([^&#]+)/)?.[1] || '';
              if (openid && access_token) break;
              if (!loc) {
                const text = String(sigResp.data || '');
                openid = text.match(/openid["']?[:=]["']?([^&"'\s]+)/)?.[1] || openid;
                access_token = text.match(/access_token["']?[:=]["']?([^&"'\s]+)/)?.[1] || access_token;
                break;
              }
              sigUrl = loc.startsWith('http') ? loc : new URL(loc, sigUrl).toString();
              if (/^[a-z]+:\/\//.test(loc) && !/^https?:/.test(loc)) {
                openid = sigUrl.match(/openid=([^&#]+)/)?.[1] || '';
                access_token = sigUrl.match(/access_token=([^&#]+)/)?.[1] || '';
                break;
              }
            } catch (e) {
              break;
            }
          }
        }

        if (!openid || !access_token) {
          answer.status = 502;
          answer.body = { status: 0, msg: '登录成功但未获取到 openid/access_token', url };
          reject(answer);
          return;
        }

        const dateNow = Date.now();
        const encrypt = cryptoAesEncrypt({ access_token });
        const pk = cryptoRSAEncrypt({ clienttime_ms: dateNow, key: encrypt.key }).toUpperCase();
        const t2 = cryptoAesEncrypt(
          `${params.cookie?.KUGOU_API_GUID}|0f607264fc6318a92b9e13c65db7cd3c|${params.cookie?.KUGOU_API_MAC}|${params.cookie?.KUGOU_API_DEV}|${dateNow}`,
          { key: liteT2Key, iv: liteT2Iv }
        );
        const t1 = cryptoAesEncrypt(`|${dateNow}`, { key: liteT1Key, iv: liteT1Iv });

        const dataMap = {
          dev: params.cookie?.KUGOU_API_DEV,
          force_login: 1,
          partnerid: 1,
          clienttime_ms: dateNow,
          t1: isLite ? t1 : 0,
          t2: isLite ? t2 : 0,
          t3: 'MCwwLDAsMCwwLDAsMCwwLDA=',
          third_appid: clientId,
          openid,
          params: encrypt.str,
          pk,
        };

        const loginResp = await useAxios({
          url: `/v6/login_by_openplat`,
          method: 'POST',
          data: dataMap,
          cookie: params.cookie,
          encryptType: 'android',
          headers: { 'x-router': 'login.user.kugou.com' },
        });

        if (loginResp.body?.status === 1) {
          const getToken = cryptoAesDecrypt(loginResp.body.data?.secu_params, encrypt.key);
          if (typeof getToken === 'object') {
            loginResp.body.data = { ...loginResp.body.data, ...getToken };
            Object.keys(getToken).forEach((key) => loginResp.cookie.push(`${key}=${getToken[key]}`));
          } else {
            loginResp.body.data['token'] = getToken;
            loginResp.cookie.push(`token=${getToken}`);
          }
          loginResp.cookie.push(`t1=${loginResp.body.data?.t1 ?? ''}`);
          loginResp.cookie.push(`userid=${loginResp.body.data?.userid || 0}`);
          loginResp.cookie.push(`vip_type=${loginResp.body.data?.vip_type || 0}`);
          loginResp.cookie.push(`vip_token=${loginResp.body.data?.vip_token || ''}`);
        }
        resolve(loginResp);
        return;
      }

      answer.status = 200;
      answer.body = { status: code, qrsig, ptqrtoken, msg };
      resolve(answer);
    } catch (e) {
      answer.status = 502;
      answer.body = { status: 0, msg: e };
      reject(answer);
    }
  });
};
