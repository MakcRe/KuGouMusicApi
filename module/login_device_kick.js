// module/login_device_kick.js
const crypto = require('crypto');
const { signatureWebParams,appid,clientver,srcappid } = require('../util');

// 概念版 RSA 公钥（已验证，与酷狗客户端一致）
const PUBLIC_KEY_LITE = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDECi0Np2UR87scwrvTr72L6oO0
1rBbbBPriSDFPxr3Z5syug0O24QyQO8bg27+0+4kBzTBTBOZ/WWU0WryL1JSXRTX
LgFVxtzIY41Pe7lPOgsfTCn5kZcvKhYKJesKnnJDNr5/abvTGf+rHG3YRwsCHcQ0
8/q6ifSioBszvb3QiwIDAQAB
-----END PUBLIC KEY-----`;

/**
 * RSA 无填充加密（用于 Token 加密）
 */
function rsaNoPadEncrypt(data, publicKeyPem) {
    const key = crypto.createPublicKey(publicKeyPem);
    const encrypted = crypto.publicEncrypt(
        {
            key: key,
            padding: crypto.constants.RSA_NO_PADDING,
        },
        data
    );
    return encrypted.toString('hex');
}

/**
 * 设备登出（踢下线）模块
 * 接受原始 token（64位十六进制），自动加密并发送请求
 */
module.exports = (params, useAxios) => {
    if (typeof useAxios !== 'function') {
        throw new Error('useAxios must be a function');
    }

    // ----- 提取参数（优先从 cookie 获取） -----
    const rawToken = params?.token || params?.cookie?.token || '';
    const userid = Number(params?.userid || params?.cookie?.userid || '0');
    const mid = params?.cookie?.KUGOU_API_MID || params?.mid || '';
    const dfid = params?.dfid || params?.cookie?.dfid || '-';
    const uuid = params?.uuid || params?.cookie?.uuid || '-';

    // ----- Token 加密（原始 token 为 64 位十六进制） -----
    let token = rawToken;
    if (/^[0-9a-f]{64}$/i.test(rawToken)) {
        const prefix = 'moc.uoguk.59::';                // 固定前缀
        const input = Buffer.from(prefix + rawToken, 'utf8');
        const padded = Buffer.alloc(128);              // RSA 1024-bit 密钥长度
        input.copy(padded);

        // 加密并添加 h5 前缀
        const encrypted = rsaNoPadEncrypt(padded, PUBLIC_KEY_LITE);
        token = 'h5' + encrypted;                       // 与客户端格式一致
    }
    // 否则 token 已经是加密后的密文（含 h5 前缀），直接使用

    // ----- 组装请求参数 -----
    const clienttime = Date.now();
    const dataMap = {
        appid,
        clientver,
        clienttime,
        mid,
        uuid,
        dfid,
        plat: params?.plat || 1,
        userid,
        token,
        srcappid,                                 // 固定值，参与签名
        t_mid: params.t_mid,
        t: params.t,
        t_appid: params.t_appid,
        t_clientver: params.t_clientver,
    };

    // ----- 生成签名 -----
    const signature = signatureWebParams(dataMap);
    const finalParams = { ...dataMap, signature };

    console.log(finalParams)

    // ----- 发送请求 -----
    return useAxios({
        url: '/loginservice/v1/dev_logout',
        method: 'GET',
        params: finalParams,
        cookie: params.cookie,
        headers: { host: 'gateway.kugou.com' },
    });
};