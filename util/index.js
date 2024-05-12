const { apiver, appid, wx_appid, wx_lite_appid, wx_secret, wx_lite_secret, srcappid, clientver, liteAppid ,liteClientver } = require('./config.json');
const {
  cryptoAesDecrypt,
  cryptoAesEncrypt,
  cryptoMd5,
  cryptoRSAEncrypt,
  cryptoSha1,
  rsaEncrypt2,
  playlistAesEncrypt,
  playlistAesDecrypt,
  publicLiteRasKey,
  publicRasKey
} = require('./crypto');
const { createRequest } = require('./request');
const { signKey, signParams, signParamsKey, signatureAndroidParams, signatureRegisterParams, signatureWebParams } = require('./helper');
const { randomString, decodeLyrics, parseCookieString, cookieToJson } = require('./util');

module.exports = {
  apiver,
  appid,
  liteAppid,
  liteClientver,
  wx_appid,
  wx_lite_appid,
  wx_secret,
  wx_lite_secret,
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
  publicLiteRasKey,
  publicRasKey,
};
