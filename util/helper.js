const { cryptoMd5 } = require('./crypto');
const { appid: useAppid, clientver: useClientver } = require('./config.json');

/**
 * web版本 signature 加密
 * @param {HelperParams} params
 * @returns {string} 加密后的signature
 */
const signatureWebParams = (params) => {
  const str = 'NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt';
  const paramsString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .sort()
    .join('');
  return cryptoMd5(`${str}${paramsString}${str}`);
};

/**
 * Android版本 signature 加密
 * @param {HelperParams} params
 * @param {string?} data
 * @returns {string} 加密后的signature
 */
const signatureAndroidParams = (params, data) => {
  const str = `OIlwieks28dk2k092lksi2UIkp`;
  const paramsString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key]}`)
    .join('');
  return cryptoMd5(`${str}${paramsString}${data || ''}${str}`);
};

/**
 * Register版本 signature 加密
 * @param {HelperParams} params
 * @returns {string} 加密后的signature
 */
const signatureRegisterParams = (params) => {
  const paramsString = Object.keys(params)
    .map((key) => params[key])
    .sort()
    .join('');
  return cryptoMd5(`1014${paramsString}1014`);
};

/**
 * sign 加密
 * @param {HelperParams} params
 * @param {string?} data
 * @returns {string} 加密后的sign
 */
const signParams = (params, data) => {
  const str = 'R6snCXJgbCaj9WFRJKefTMIFp0ey6Gza';
  const paramsString = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join('');
  return cryptoMd5(`${paramsString}${data || ''}${str}`);
};

/**
 * signKey 加密
 * @param {string} hash
 * @param {string} mid
 * @param {(string | number)?} userid
 * @param {(string | number)?} appid
 * @returns {string} 加密后的sign
 */
const signKey = (hash, mid, userid, appid) => {
  return cryptoMd5(`${hash}57ae12eb6890223e355ccfcb74edf70d${appid || useAppid}${mid}${userid || 0}`);
};

/**
 * signParams 加密
 * @param {string | number} data
 * @param {(string | number)?} appid
 * @param {(string | number)?} clientver
 * @returns {string} 加密后的signParams
 */

const signParamsKey = (data, appid, clientver) => {
  return cryptoMd5(`${appid || useAppid}OIlwieks28dk2k092lksi2UIkp${clientver || useClientver}${data}`);
};

module.exports = {
  signKey,
  signParams,
  signParamsKey,
  signatureAndroidParams,
  signatureRegisterParams,
  signatureWebParams,
};
