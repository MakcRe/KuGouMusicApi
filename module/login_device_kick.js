const crypto = require('crypto');
const { signatureWebParams,appid,clientver,srcappid,publicLiteRasKey } = require('../util');

/**
 * RSA 无填充加密（用于 Token 加密，区别于项目的RSA加密函数）
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
 *  token需要加密为接口需要的特定格式才能成功进行鉴权
 */
module.exports = (params, useAxios) => {
    // ----- 提取参数（优先从 cookie 获取） -----
    const rawToken = params?.token || params?.cookie?.token || '';
    const userid = Number(params?.userid || params?.cookie?.userid || '0');
    const mid = params?.cookie?.KUGOU_API_MID || params?.mid || '';
    const dfid = params?.dfid || params?.cookie?.dfid || '-';
    const uuid = params?.uuid || params?.cookie?.uuid || '-';

    // ----- Token 加密部分 -----
    let token = rawToken;
    const prefix = 'moc.uoguk.59::';                // 固定前缀
    const input = Buffer.from(prefix + rawToken, 'utf8');
    const padded = Buffer.alloc(128);
    input.copy(padded);
    // 加密并添加 h5 前缀
    const encrypted = rsaNoPadEncrypt(padded, publicLiteRasKey).toUpperCase();
    token = 'h5' + encrypted;                       // 与客户端格式一致

    // ----- 组装请求参数 -----
    const clienttime = Date.now();
    const dataMap = {
        appid,
        clientver,
        clienttime,
        mid,
        uuid,
        dfid,
        plat: 1,
        userid,
        token,
        srcappid,
        t_mid: params.t_mid,
        t: params.t,
        t_appid: params.t_appid,
        t_clientver: params.t_clientver,
    };

    // ----- 生成签名 -----
    const signature = signatureWebParams(dataMap);      //这里使用web版签名
    const finalParams = { ...dataMap, signature };      //封装好的最终请求参数

    // ----- 发送请求 -----
    return useAxios({
        url: '/loginservice/v1/dev_logout',
        method: 'GET',
        params: finalParams,
        cookie: params?.cookie || {},
        headers: { 'Host':'gateway.kugou.com'}
    });
};
