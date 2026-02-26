const CryptoJS = require('crypto-js');
const forge = require('node-forge');
const { randomString } = require('./util');
const publicRasKey = `-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDIAG7QOELSYoIJvTFJhMpe1s/gbjDJX51HBNnEl5HXqTW6lQ7LC8jr9fWZTwusknp+sVGzwd40MwP6U5yDE27M/X1+UR4tvOGOqp94TJtQ1EPnWGWXngpeIW5GxoQGao1rmYWAu6oi1z9XkChrsUdC6DJE5E221wf/4WLFxwAtRQIDAQAB\n-----END PUBLIC KEY-----`;
const publicLiteRasKey = `-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDECi0Np2UR87scwrvTr72L6oO01rBbbBPriSDFPxr3Z5syug0O24QyQO8bg27+0+4kBzTBTBOZ/WWU0WryL1JSXRTXLgFVxtzIY41Pe7lPOgsfTCn5kZcvKhYKJesKnnJDNr5/abvTGf+rHG3YRwsCHcQ08/q6ifSioBszvb3QiwIDAQAB\n-----END PUBLIC KEY-----`;

const rsaKeyCache = new Map();

function normalizeBuffer(data) {
  if (Buffer.isBuffer(data)) return data;
  if (typeof data === 'string') return Buffer.from(data);
  return Buffer.from(JSON.stringify(data));
}

function wordArrayFromBuffer(buffer) {
  return CryptoJS.lib.WordArray.create(buffer);
}

function wordArrayToBuffer(wordArray) {
  const { words, sigBytes } = wordArray;
  const buffer = Buffer.alloc(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    buffer[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return buffer;
}

function utf8WordArray(input) {
  return typeof input === 'string' ? CryptoJS.enc.Utf8.parse(input) : wordArrayFromBuffer(input);
}

function getForgePublicKey(pem) {
  if (!rsaKeyCache.has(pem)) {
    rsaKeyCache.set(pem, forge.pki.publicKeyFromPem(pem));
  }
  return rsaKeyCache.get(pem);
}

function bufferToBinaryString(buffer) {
  let out = '';
  for (let i = 0; i < buffer.length; i++) out += String.fromCharCode(buffer[i]);
  return out;
}

function rsaRawEncrypt(buffer, publicKey) {
  const keyLength = Math.ceil(publicKey.n.bitLength() / 8);
  const message = new forge.jsbn.BigInteger(buffer.toString('hex'), 16);
  const encrypted = message.modPow(publicKey.e, publicKey.n);
  return encrypted.toString(16).padStart(keyLength * 2, '0');
}

/**
 * @typedef {{str: string, key: string}} AesEncrypt
 */

/**
 * MD5 加密
 * @param {BufferLike} data
 * @returns {string}
 */
function cryptoMd5(data) {
  const buffer = typeof data === 'object' ? JSON.stringify(data) : data;
  return CryptoJS.MD5(buffer).toString(CryptoJS.enc.Hex);
}

/**
 * Sha1 加密
 * @param {BufferLike} data
 * @returns { string }
 */
function cryptoSha1(data) {
  const buffer = typeof data === 'object' ? JSON.stringify(data) : data;
  return CryptoJS.SHA1(buffer).toString(CryptoJS.enc.Hex);
}

/**
 * AES 加密
 * @param {BufferLike} data 需要加密的数据
 * @param {{ key?:string, iv?: string } | undefined} opt
 * @returns {AesEncrypt | string}
 */
function cryptoAesEncrypt(data, opt) {
  if (typeof data === 'object') data = JSON.stringify(data);
  const buffer = normalizeBuffer(data);
  let key;
  let iv;
  let tempKey = '';

  if (opt?.key && opt?.iv) {
    key = opt.key;
    iv = opt.iv;
  } else {
    tempKey = opt?.key || randomString(16).toLowerCase();
    key = cryptoMd5(tempKey).substring(0, 32);
    iv = key.substring(key.length - 16);
  }

  const encrypted = CryptoJS.AES.encrypt(wordArrayFromBuffer(buffer), utf8WordArray(key), {
    iv: utf8WordArray(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const hex = CryptoJS.enc.Hex.stringify(encrypted.ciphertext);
  if (opt?.key && opt?.key) return hex;
  return { str: hex, key: tempKey };
}

/**
 * AES 解密
 * @param {string} data
 * @param {string} key
 * @param {string?} iv
 * @returns {string | Record<string, string>}
 */
function cryptoAesDecrypt(data, key, iv) {
  if (!iv) key = cryptoMd5(key).substring(0, 32);
  iv = iv || key.substring(key.length - 16);
  const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Hex.parse(data) });

  const decrypted = CryptoJS.AES.decrypt(cipherParams, utf8WordArray(key), {
    iv: utf8WordArray(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const text = wordArrayToBuffer(decrypted).toString();
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

/**
 * RSA加密
 * @param {BufferLike} data
 * @param {string?} publicKey
 * @returns {string} hex
 */
function cryptoRSAEncrypt(data, publicKey) {
  const isLite = process.env.platform === 'lite';
  const buffer = normalizeBuffer(data);
  const pem = publicKey || (isLite ? publicLiteRasKey : publicRasKey);
  const key = getForgePublicKey(pem);
  const keyLength = Math.ceil(key.n.bitLength() / 8);

  if (buffer.length > keyLength) throw new Error('Data length exceeds key size');
  const padded = buffer.length === keyLength ? buffer : Buffer.concat([buffer, Buffer.alloc(keyLength - buffer.length)]);

  return rsaRawEncrypt(padded, key);
}

function rsaEncrypt2(data) {
  const isLite = process.env.platform === 'lite';
  const buffer = normalizeBuffer(data);
  const key = getForgePublicKey(isLite ? publicLiteRasKey : publicRasKey);
  const encrypted = key.encrypt(bufferToBinaryString(buffer), 'RSAES-PKCS1-V1_5');
  const encryptedBuffer = Buffer.from(encrypted, 'binary');
  return encryptedBuffer.toString('hex');
}

function playlistAesEncrypt(data) {
  const useData = typeof data === 'object' ? JSON.stringify(data) : data;
  const key = randomString(6).toLowerCase();
  const encryptKey = cryptoMd5(key).substring(0, 16);
  const iv = cryptoMd5(key).substring(16, 32);

  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(useData), utf8WordArray(encryptKey), {
    iv: utf8WordArray(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return { key, str: CryptoJS.enc.Base64.stringify(encrypted.ciphertext) };
}

function playlistAesDecrypt(data) {
  const encryptKey = cryptoMd5(data.key).substring(0, 16);
  const iv = cryptoMd5(data.key).substring(16, 32);

  const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Base64.parse(data.str) });
  const decrypted = CryptoJS.AES.decrypt(cipherParams, utf8WordArray(encryptKey), {
    iv: utf8WordArray(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const text = wordArrayToBuffer(decrypted).toString();
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

module.exports = {
  cryptoAesDecrypt,
  cryptoAesEncrypt,
  cryptoMd5,
  cryptoRSAEncrypt,
  rsaEncrypt2,
  cryptoSha1,
  playlistAesEncrypt,
  playlistAesDecrypt,
  publicLiteRasKey,
  publicRasKey,
};
