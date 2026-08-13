//加入队伍
const crypto = require('crypto');
const { cryptoMd5,appid,clientver,srcappid,publicLiteRasKey } = require('../util');

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

//带请求体签名
function signatureWebParamsWithBody(params, bodyStr) {
    const SALT = 'NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt';
    const paramsString = Object.keys(params)
        .sort()
        .map(k => `${k}=${params[k]}`)
        .join('');
    const input = SALT + paramsString + bodyStr + SALT;
    return cryptoMd5(input);
}

module.exports = (params, useAxios) => {

    const rawToken = params?.token || params?.cookie?.token || '';
    const userid = Number(params?.userid || params?.cookie?.userid || '0');
    const mid = params?.cookie?.KUGOU_API_MID || params?.mid || '';
    const dfid = params?.dfid || params?.cookie?.dfid || '-';
    const uuid = params?.uuid || params?.cookie?.uuid || '-';

    let token = rawToken;
    const prefix = 'moc.uoguk.59::';                
    const input = Buffer.from(prefix + rawToken, 'utf8');
    const padded = Buffer.alloc(128);
    input.copy(padded);

    const encrypted = rsaNoPadEncrypt(padded, publicLiteRasKey).toUpperCase();
    token = 'h5' + encrypted;                       

    const clienttime = Date.now();
    const paramsMap = {
        srcappid,
        clientver,
        clienttime,
        mid,
        uuid,
        dfid,
        appid,
        userid,
        token,
    };

    const dataMap = { team_code: params.team_code };
    //转为字符串参与签名
    const dataStr = JSON.stringify(dataMap);

    const signature = signatureWebParamsWithBody(paramsMap, dataStr);
    const finalParams = { ...paramsMap, signature };

    return useAxios({
        url: '/youth/v1/ut/join_team',
        method: 'POST',
        data: dataMap,
        params: finalParams,
        cookie: params?.cookie || {},
        headers: { 'Host': 'gateway.kugou.com' },
    });
};
