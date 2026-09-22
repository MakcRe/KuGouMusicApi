const { playlistAesEncrypt, playlistAesDecrypt, rsaEncrypt2, signParamsKey, clientver, appid } = require('../util');

module.exports = (params, useAxios) => {
  const answer = { status: 500, body: {}, cookie: [] };
  return new Promise(async (resolve) => {
    try {
      const userid = params?.userid || params?.cookie?.userid || 0;
      const token = params?.token || params.cookie?.token || '';
      const mid = params?.cookie?.mid || params?.mid || 0;
      const clienttime = Math.floor(Date.now() / 1000);
      const dfid = params?.dfid || params?.cookie?.dfid || '-';
      const obj_id = Number(params.id);

      const dataMap = {
        "ctype":2,
        "data":[{"obj_id":obj_id}]
      };

      const aesEncrypt = playlistAesEncrypt(dataMap);

      const p = rsaEncrypt2({ aes: aesEncrypt.key, uid: userid, token }).toUpperCase();

      const paramsMap = {
        clienttime,
        mid,
        key: signParamsKey(clienttime.toString()),
        dfid,
        clientver,
        appid,
        p,
      };

      const respone = await useAxios({
        baseURL:'https://collectservice.kugou.com',
        url: '/v1/cancel_collect',
        params: paramsMap,
        data: Buffer.from(aesEncrypt.str, 'base64'),
        method: 'POST',
        encryptType: 'android',
        headers:{
            'User-Agent': 'Android9-1070-${clientver}-18-0-MV/UnCare-wifi',
            'KG-THash': Math.floor(Math.random() * 0xfffffff),
            'Content-Type': 'application/json'

        },
        //clearDefaultParams: true,
        notSignature: true,
        responseType: 'arraybuffer',
        cookie: params?.cookie || {},
      });

      respone.body = playlistAesDecrypt({ str: respone.body.toString('base64'), key: aesEncrypt.key });

      resolve(respone);
    } catch (error) {
      console.log(error);
      answer.body = error;
      resolve(answer);
    }
  });
};
