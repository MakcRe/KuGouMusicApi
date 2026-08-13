//获取我的队伍状态
const crypto = require('crypto');
const { signatureWebParams,appid,clientver,srcappid,publicLiteRasKey } = require('../util');

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
    const dataMap = {
        srcappid,
        clientver,
        clienttime,
        mid,
        uuid,
        dfid,
        appid,
        userid,
        token,
        period_id: params.period_id
    };

    const signature = signatureWebParams(dataMap);     
    const finalParams = { ...dataMap, signature };      

    return useAxios({
        url: '/youth/v1/ut/get_my_team_info',
        method: 'GET',
        params: finalParams,
        cookie: params?.cookie || {},
        headers: { 'Host':'gateway.kugou.com'}
    });
};