//分享歌曲

const {  appid, clientver, signParamsKey } = require('../util');

module.exports = (params, useAxios) => {
  const tuid = Number(params.receiverid);
  const dateTime = Date.now();
  const yourname = params.sendername;
  const dataMap = {
    tuid: tuid,
    ingress: 分享歌曲,
    message:{
        msgtype: 251,
        alert: "[分享歌曲]",
        nickname: yourname,
        source: 0,
        follow_source: 0,
        nt: "",
        data:{
          songid: params.songhash,
          songname:  params.songname,
          singername: params.singername,
          filename: params.filename,
          classmapattr0: 0,
          mixId: 0 
        },
        fakeid:"0",

    },
    mid,
    dfid,
    uuid,
    clientver,
    appid,
    clienttime: dateTime,

  };

return useAxios({
    url: '/v1/chat/send',
    encryptType: 'android',
    method: 'POST',
    data: dataMap,
    cookie: params?.cookie,
    headers: { 'x-router': 'msg.mobile.kugou.com' }
  });

}
