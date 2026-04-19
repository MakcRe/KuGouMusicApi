 //上传用户听歌时长
const {  clientver, appid,signParamsKey,uuid, cryptoRSAEncrypt } = require('../util');
    module.exports = (params, useAxios) => {
        const userid = params?.userid || params?.cookie?.userid || 0;
        const token = params?.token || params.cookie?.token || '';
        const mid = params?.cookie?.KUGOU_API_MID;
        const dateTime = Date.now();
        const clienttime = Math.floor(Date.now() / 1000);
        const p = cryptoRSAEncrypt({ clienttime, token }).toUpperCase();
        const dataMap = {
            mid,
            diff_sec: "0",
            y_type: "0",
            type: "1",
            uuid,
            userid,
            p,
            appid,
            d_sec: "0",
            clientver,
            clienttime,
            m_type: "0",
            key: signParamsKey(clienttime.toString())
 
        }

return useAxios({
    baseURL: "http://userinfo.user.kugou.com",
    url: '/v2/get_grade_info',
    encryptType: 'android',
    method: 'POST',
    data: dataMap,
    cookie: params?.cookie,
    headers: { 'Host': 'userinfo.user.kugou.com' }
  });

}