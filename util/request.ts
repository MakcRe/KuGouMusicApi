import { cryptoMd5 } from './crypto';
import { signatureAndroidParams, signatureRegisterParams, signatureWebParams, signKey, signParams } from './helper';
import axios, { AxiosRequestConfig } from 'axios';
import { parseCookieString } from './util';


export const createRequest = (options: UseAxiosRequestConfig): Promise<UseAxiosResponse> => {
  return new Promise<UseAxiosResponse>(async (resolve, reject) => {
    const dfid = options?.cookie?.dfid || '-'; // 自定义
    const mid = cryptoMd5(dfid); // 可以自定义
    const uuid = cryptoMd5(`${dfid}${mid}`); // 可以自定义
    const token = options?.cookie?.token || '';
    const userid = options?.cookie?.userid || 0;
    const appid = 1005; // 该为设备id, 安卓、ios、桌面都不相同。
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
      appid,
      apiver: 20,
      clientver: 11309,
      userid,
      clienttime,
    };

    if (token) defaultParams['token'] = token;
    const params = options?.clearDefaultParams ? (options?.params || {}) : Object.assign({}, defaultParams, options?.params || {});

    headers['clienttime'] = params.clienttime;

    if (options?.encryptKey) {
      params['key'] = signKey(params['hash'], params['mid'], params['userid'], params['appid']);
    }
    const data = typeof options?.data === 'object' ? JSON.stringify(options.data) : options?.data || '';


    // if (!options.notSign) {
    //   params['sign'] = signParams(params, data);
    // }
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

    options.params = params;
    options.baseURL = options?.baseURL || 'https://gateway.kugou.com';
    options.headers = Object.assign({}, options?.headers || {}, { dfid, clienttime: params.clienttime, mid });

    const requestOptions: AxiosRequestConfig = {
      params,
      data: options?.data,
      method: options.method,
      baseURL: options.baseURL,
      url: options.url,
      headers: Object.assign({}, options?.headers || {}, headers),
    };


    const answer: UseAxiosResponse = { status: 500, body: {}, cookie: [] };
    try {
      const response = await axios(requestOptions);
      const body = response.data;
      answer.cookie = (response.headers['set-cookie'] || []).map((x) => parseCookieString(x));

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