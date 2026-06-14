'use strict';
const crypto = require('crypto'); // Node 原生 crypto（提供 RSA、AES、Random）
const { TextEncoder, TextDecoder } = require('util'); // Web Crypto 兼容层
const { generateSimulate } = require('../util/generate_simulate');
const { generateWebGLHash } = require('../util/util');
const verifyUserInfo = require('./verify_user_info');


// ------------------------------------------------------------------
// 1️⃣ 常量（直接拷贝自原脚本）
// ------------------------------------------------------------------
const RSA_SPKI_HEX =
  '30820122300d06092a864886f70d01010105000382010f003082010a0282010100a16dbe625a3c00b78f4904cfd31045945984387bc10fdb52facec30657ca12edd1cf3bd94da5f526d61b5f8f80554aa3e80473f0833e08a072a8616f6c737f5bae17c4d23eabbcf7e9a8c22f75532765b91bd302262b5cea819b8ab7b83507e1684ab49c2fa1c41590bc26c815f940d88b6b2d46d253bcf56c703f6be8e5426e0e5af63e20a9d3af23894cfb93d7234e5636c9f3004b2b2d83810afda4fa963e6110b46a51e4833d57c29aa3a3da49d29839619b5f78b6f91cc82a1bd9531c6d2707556ea3e50cf956f61e3fc4805ce7a2e0bebe1a225f2716dc1b8f85095544c5b86aecd2d63d1ffb57bd9db675408ab86c56fe05bb645fa05f3eaf1ed61aad0203010001';

const AES_IV_HEX = '6b75676f757365637572697479313233'; // "kugousecurity123"
const SENTINEL = 0xffffffff - Math.floor(Math.random() * 20);

// ------------------------------------------------------------------
// 2️⃣ 工具函数（保持原脚本签名）
// ------------------------------------------------------------------

/**
 * hex -> ArrayBuffer
 * @param {string} hex
 * @returns {ArrayBuffer}
 */
function hex2buf(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  return arr.buffer;
}

/**
 * ArrayBuffer -> hex
 * @param {ArrayBuffer} buf
 * @returns {string}
 */
function buf2hex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 随机整数（闭区间）
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function ri(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成 WebGL 指纹哈希
 * - 在浏览器里会真实读取 GPU 信息
 * - 在 Node 环境直接返回 64‑bit 随机数的十进制字符串
 * @returns {string}
 */

/**
 * 贝塞尔曲线生成平滑鼠标路径（未改动）
 * @param {number} sx
 * @param {number} sy
 * @param {number} ex
 * @param {number} ey
 * @param {number} n 采样点数
 * @returns {Array<{x:number,y:number}>}
 */
function bezierPath(sx, sy, ex, ey, n) {
  const c1x = sx + (ex - sx) * 0.3 + ri(-80, 80);
  const c1y = sy + (ey - sy) * 0.2 + ri(-60, 60);
  const c2x = sx + (ex - sx) * 0.7 + ri(-60, 60);
  const c2y = sy + (ey - sy) * 0.8 + ri(-40, 40);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const x = u * u * u * sx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex;
    const y = u * u * u * sy + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey;
    const jitter = Math.max(0.5, 3 - t * 2.5);
    pts.push({
      x: x + (Math.random() - 0.5) * jitter,
      y: y + (Math.random() - 0.5) * jitter,
    });
  }
  return pts;
}

/* ---------- 事件格式化函数（原样拷贝） ---------- */
function f3(t, i, x, y) {
  return `3,${t},${i},${x},${y}`;
}
function f5(t, i) {
  return `5,${t},${i}`;
}
function f6(t, i, x, y) {
  return `6,${t},${i},${x},${y}`;
}
function fs3(i, x, y) {
  return `3,${SENTINEL},${i},${x},${y}`;
}
function fs5(i) {
  return `5,${SENTINEL},${i}`;
}
function fs6(i, x, y) {
  return `6,${SENTINEL},${i},${x},${y}`;
}

/**
 * 生成行为指纹（EDT）数据
 * 完整保持原脚本的生成规则（鼠标轨迹、滚动、窗口事件、哨兵记录）
 * @param {Object} opts
 * @returns {string}
 */
function generateEDTData(opts) {
  const { startX, startY, endX, endY, mousePoints } = opts;
  const entries = [];
  let ts = 0; // 时间戳累计
  let ei = 0; // 事件全局索引

  // 初始化：两个 type-5 零事件（WASM 启动时的记录）
  entries.push(f5(0, 0));
  entries.push(fs5(0));
  entries.push(f5(0, 0));
  entries.push(fs5(0));

  // 窗口事件 (type 6) – 加载/resize
  ts += ri(5, 20);
  entries.push(f6(ts, ei, 750, 500));
  entries.push(fs6(ei, 750, 500));
  ei++;

  // 模拟 3 次滚动 (type 5)
  for (let i = 0; i < 3; i++) {
    ts += ri(80, 600);
    entries.push(f5(ts, ei));
    entries.push(fs5(ei));
    ei++;
  }

  // 鼠标轨迹 (type 3) – 贝塞尔平滑曲线
  const path = bezierPath(startX, startY, endX, endY, mousePoints);
  let si = 0;
  for (let i = 0; i < path.length; i++) {
    const { x, y } = path[i];
    ts += ri(8, 50);
    entries.push(f3(ts, si, Math.round(x), Math.round(y)));
    entries.push(fs3(si, Math.round(x), Math.round(y)));

    // 每 12 帧插入一次滚动事件，模拟边滚动边移动
    if (i > 0 && i % 12 === 0) {
      ts += ri(20, 60);
      entries.push(f5(ts, ei));
      entries.push(fs5(ei));
      ei++;
    }
    si = (si + 1) % 2;
  }

  // 结束事件 – 最后一个鼠标位置略带随机偏移
  ts += ri(5, 30);
  entries.push(f3(ts, 1, Math.round(endX + ri(-5, 5)), Math.round(endY + ri(-5, 5))));
  entries.push(fs3(1, Math.round(endX), Math.round(endY)));

  return entries.join(':');
}

/**
 * hex -> Base64（Node 版）
 * @param {string} hex
 * @returns {string}
 */
function hexToBase64(hex) {
  const buf = Buffer.from(hex, 'hex');
  return buf.toString('base64');
}

/**
 * 将 Uint8Array（或 ArrayBuffer）转为十六进制字符串
 * @param {ArrayBuffer|Uint8Array} data
 * @returns {string}
 */
function arrayBufferToHex(data) {
  const view = new Uint8Array(data);
  return Buffer.from(view).toString('hex');
}

/**
 * RSA‑OAEP‑SHA256 加密 AES 密钥（返回 hex）
 * 使用 Node 的 crypto.publicEncrypt
 * @param {Uint8Array} aesKeyRaw
 * @returns {string} RSA ciphertext (hex)
 */
function rsaEncryptAesKey(aesKeyRaw) {
  // 把十六进制 DER 公钥包装成 PEM
  const derBuf = Buffer.from(RSA_SPKI_HEX, 'hex');
  const pem = `-----BEGIN PUBLIC KEY-----\n${derBuf.toString('base64')}\n-----END PUBLIC KEY-----`;
  const pubKey = crypto.createPublicKey(pem);
  const encrypted = crypto.publicEncrypt(
    {
      key: pubKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(aesKeyRaw)
  );
  return encrypted.toString('hex');
}

/**
 * AES‑128‑CBC 加密（返回 hex）
 * @param {Uint8Array} aesKeyRaw - 16 bytes
 * @param {string} plaintext   - UTF‑8 明文
 * @returns {string} Ciphertext (hex)
 */
function aesCbcEncrypt(aesKeyRaw, plaintext) {
  const iv = Buffer.from(AES_IV_HEX, 'hex');
  const key = Buffer.from(aesKeyRaw);
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  const ptBuf = Buffer.from(plaintext, 'utf8');
  const ct = Buffer.concat([cipher.update(ptBuf), cipher.final()]);
  return ct.toString('hex');
}

/**
 * 完整的加密流程（等价于浏览器 encryptSid）
 * @param {string} plaintext - 要加密的完整行为明文
 * @returns {Object} 包含 aesKeyHex、aesCiphertextHex、rsaCiphertextHex（均为 hex）
 */
function encryptSid(plaintext) {
  // 1️⃣ 随机 AES‑128 密钥（16 字节）
  const aesKeyRaw = crypto.randomBytes(16); // Uint8Array / Buffer
  const aesKeyHex = arrayBufferToHex(aesKeyRaw);

  // 2️⃣ AES‑CBC 加密明文 → EDT（hex）
  const aesCiphertextHex = aesCbcEncrypt(aesKeyRaw, plaintext);

  // 3️⃣ RSA‑OAEP‑SHA256 加密 AES 密钥 → SID（hex）
  const rsaCiphertextHex = rsaEncryptAesKey(aesKeyRaw);

  return {
    plaintext,
    aesKeyHex,
    aesIvHex: AES_IV_HEX,
    aesCiphertextHex,
    rsaCiphertextHex,
  };
}

/**
 * 生成最终返回给前端的 sid / edt（Base64）
 * @param {Object} opts
 *   - {string} userid
 *   - {string} dfid
 *   - {string} mid
 *   - {Object} [webgl]   // 若不提供则自动随机生成
 *   - {Object} [edtParams]  // 鼠标路径等可选配置
 * @returns {Promise<{sid:string, edt:string}>}
 */
async function generateSidEdt(opts) {
  const {
    userid = '0',
    dfid = '0',
    mid = '0',
    webgl = generateWebGLHash(),
    edtParams = {},
  } = opts || {};

  // ---- 生成鼠标轨迹与行为数据（EDT 明文） ----
  const {
    startX = ri(200, 600),
    startY = ri(200, 500),
    endX = ri(500, 700),
    endY = ri(80, 150),
    mousePoints = ri(30, 60),
  } = edtParams;

  const edtData = generateEDTData({
    startX,
    startY,
    endX,
    endY,
    mousePoints,
  });

  // ---- 拼装完整的 sid 明文 ----
  const ts = Date.now();
  const sidPlaintext = `mid=${mid};userid=${userid};dfid=${dfid};webgl=${webgl};webdriver=0;ts=${ts};data=${edtData}`;

  // ---- 加密 ----
  const result = encryptSid(sidPlaintext);

  // ---- 转为 Base64（和浏览器端保持一致） ----
  const sid = hexToBase64(result.rsaCiphertextHex);
  const edt = hexToBase64(result.aesCiphertextHex); 

  return { sid, edt };
}

// ------------------------------------------------------------------
// 导出接口（CommonJS）
// ------------------------------------------------------------------
module.exports = {
  generateSidEdt,
  // 同时把所有内部函数一起导出，方便调试或自行复用
  generateWebGLHash,
  generateEDTData,
  bezierPath,
  f3,
  f5,
  f6,
  fs3,
  fs5,
  fs6,
  ri,
  hex2buf,
  buf2hex,
  encryptSid,
  hexToBase64,
};

module.exports = async (params, useAxios) => {
  const webglHash = params?.cookie.KUGOU_API_WEBGL || generateWebGLHash(); // WebGL 指纹哈希
  const userid = params?.userid || params?.cookie.userid || '0';
  const dfid = params?.dfid || params?.cookie.dfid || '0';
  const mid = params?.mid || params?.cookie.KUGOU_API_MID || '0';
  const value = generateSimulate(mid, userid, dfid, webglHash);
  const userParams = { ...params, edt: value.edt, sid: value.sid };
  return verifyUserInfo(userParams, useAxios);
};
