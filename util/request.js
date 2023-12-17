const axios = require('axios');
const { cryptoMd5 } = require('./crypto');
const { signKey, signatureAndroidParams, signatureRegisterParams, signatureWebParams } = require('./helper');
const { parseCookieString } = require('./util');
const { appid, clientver, apiver } = require('./config.json');

/**
 * 请求创建
 * @param {UseAxiosRequestConfig} options
 * @returns {Promise<UseAxiosResponse>}
 */
const createRequest = (options) => {
  return new Promise(async (resolve, reject) => {
    const dfid = options?.cookie?.dfid || '-'; // 自定义
    const mid = cryptoMd5(dfid); // 可以自定义
    const uuid = cryptoMd5(`${dfid}${mid}`); // 可以自定义
    const token = options?.cookie?.token || '';
    const userid = options?.cookie?.userid || 0;
    const clienttime = Date.now();
    const ip = options?.realIP || options?.ip || '';
    const headers = { dfid, clienttime, mid };

    if (ip) {
      headers['X-Real-IP'] = ip;
      headers['X-Forwarded-For'] = ip;
    }

    const defaultParams = {
      dfid,
      mid,
      uuid,
      appid: appid,
      apiver: apiver,
      clientver: clientver,
      userid,
      clienttime,
    };

    if (token) defaultParams['token'] = token;
    const params = options?.clearDefaultParams ? options?.params || {} : Object.assign({}, defaultParams, options?.params || {});

    headers['clienttime'] = params.clienttime;

    if (options?.encryptKey) {
      params['key'] = signKey(params['hash'], params['mid'], params['userid'], params['appid']);
    }

    const data = typeof options?.data === 'object' ? JSON.stringify(options.data) : options?.data || '';

    if (!params['signature']) {
      switch (options?.encryptType) {
        case 'register':
          params['signature'] = signatureRegisterParams(params);
          break;
        case 'web':
          params['signature'] = signatureWebParams(params);
          break;
        case 'android':
        default:
          params['signature'] = signatureAndroidParams(params, data);
          break;
      }
    }

    // options.params = params;
    options['params'] = params;
    options['baseURL'] = options?.baseURL || 'https://gateway.kugou.com';
    options['headers'] = Object.assign({}, options?.headers || {}, { dfid, clienttime: params.clienttime, mid });

    const requestOptions = {
      params,
      data: options?.data,
      method: options.method,
      baseURL: options?.baseURL,
      url: options.url,
      headers: Object.assign({}, options?.headers || {}, headers),
      withCredentials: true,
      responseType: options.responseType,
    };

    if (options.data) requestOptions.data = options.data;
    if (params) requestOptions.params = params;

    if (options.baseURL?.includes('openapicdn')) {
      const url = requestOptions.url;
      const _params = Object.keys(params)
        .map((key) => `${key}=${params[key]}`)
        .join('&');
      requestOptions.url = `${url}?${_params}`;
      requestOptions.params = {};
    }

    const answer = { status: 500, body: {}, cookie: [], headers: {} };
    try {
      const response = await axios(requestOptions);

      const body = response.data;

      answer.cookie = (response.headers['set-cookie'] || []).map((x) => parseCookieString(x));

      if (response.headers['ssa-code']) {
        answer.headers['ssa-code'] = response.headers['ssa-code'];
      }

      try {
        answer.body = JSON.parse(body.toString());
      } catch (error) {
        answer.body = body;
      }

      if (response.data.status === 0 || (response.data?.error_code && response.data.error_code !== 0)) {
        answer.status = 502;
        reject(answer);
      } else {
        answer.status = 200;
        resolve(answer);
      }
    } catch (e) {
      answer.status = 502;
      answer.body = { status: 0, msg: e };
      reject(answer);
    }
  });
};

module.exports = { createRequest };
