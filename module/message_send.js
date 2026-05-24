//发送信息

const {  appid, clientver, signParamsKey } = require('../util');

module.exports = (params, useAxios) => {
  const tuid = Number(params.receiverid);
  const dateTime = Date.now();
  const alert = params.content;
  const yourname = params.sendername;
  const receivername =  params.receiver ? `/${receiver}`: undefined;
  const dataMap = {
    tuid: tuid,
    ingress: receivername,
    message:{
        msgtype: 201,
        alert,
        nickname: yourname,
        source: 0,
        follow_source: 0,
        location: "",
        nt: "",
        fakeid:"",

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