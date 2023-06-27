import { cryptoMd5 } from './crypto';
import { mapToObject } from './util';

export const signatureWebParams = (params: HelperParams) => {
  const isMap = params instanceof Map;
  const obj = isMap ? mapToObject(params) : params;
  const paramsString = Object.keys(obj)
    .map((key) => params[key])
    .sort()
    .join('');
  return cryptoMd5(paramsString);
};

export const signatureAndroidParams = (params: HelperParams, data?: string) => {
  const isMap = params instanceof Map;
  const obj = isMap ? mapToObject(params) : params;
  const str = `OIlwieks28dk2k092lksi2UIkp`;
  const paramsString = Object.keys(obj)
    .sort()
    .map((key) => `${key}=${typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : obj[key]}`)
    .join('');
  return cryptoMd5(`${str}${paramsString}${data || ''}${str}`);
};

export const signatureRegisterParams = (params: HelperParams) => {
  const obj = params instanceof Map ? mapToObject(params) : params;
  const paramsString = Object.keys(obj)
    .map((key) => obj[key])
    .sort()
    .join('');
  return cryptoMd5(`1014${paramsString}1014`);
};

export const signParams = (params: HelperParams, data?: string) => {
  const str = 'R6snCXJgbCaj9WFRJKefTMIFp0ey6Gza';
  const obj = params instanceof Map ? mapToObject(params) : params;
  const paramsString = Object.keys(obj)
    .sort()
    .map((key) => `${key}${obj[key]}`)
    .join('');
  return cryptoMd5(`${paramsString}${data || ''}${str}`);
};


export const signKey = (hash: string, mid: string, userid: string | number, appid: number | string) => {
  return cryptoMd5(`${hash}57ae12eb6890223e355ccfcb74edf70d${appid}${mid}${userid}`);
};

export const signParamsKey = (data: string | number, appid: number | string = 1005, clientver: string | number = 11309) => {
  return cryptoMd5(`${appid}OIlwieks28dk2k092lksi2UIkp${clientver}${data}`);
};