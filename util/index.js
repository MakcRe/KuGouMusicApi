const { apiver, appid, wx_appid, wx_secret, srcappid, clientver } = require('./config.json');
const {
  cryptoAesDecrypt,
  cryptoAesEncrypt,
  cryptoMd5,
  cryptoRSAEncrypt,
  cryptoSha1,
  rsaEncrypt2,
  playlistAesEncrypt,
  playlistAesDecrypt,
} = require('./crypto');
const { createRequest } = require('./request');
const { signKey, signParams, signParamsKey, signatureAndroidParams, signatureRegisterParams, signatureWebParams } = require('./helper');
const { randomString, decodeLyrics, parseCookieString, cookieToJson } = require('./util');

module.exports = {
  apiver,
  appid,
  wx_appid,
  wx_secret,
  srcappid,
  clientver,
  cryptoAesDecrypt,
  cryptoAesEncrypt,
  cryptoMd5,
  cryptoRSAEncrypt,
  cryptoSha1,
  rsaEncrypt2,
  playlistAesEncrypt,
  playlistAesDecrypt,
  createRequest,
  signKey,
  signParams,
  signParamsKey,
  signatureAndroidParams,
  signatureRegisterParams,
  signatureWebParams,
  randomString,
  decodeLyrics,
  parseCookieString,
  cookieToJson,
};
