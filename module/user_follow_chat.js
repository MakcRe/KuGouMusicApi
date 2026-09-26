// 统一私信发送接口
// 网关：POST https://gateway.kugou.com/v1/chat/send（x-router: msg.mobile.kugou.com）
//
// 参数说明：
//   tuid          目标用户 uid，首次给对方发消息时使用（与 tag 二选一）
//   tag           会话标识，形如 chat:对方uid_自己uid，已有会话回信用（与 tuid 二选一）
//   alert         文本内容，msgtype=201 时必填
//   msgtype       消息类型，默认 201（文本）；其余类型对应图片/语音等富媒体消息
//   nickname      发送者昵称，仅展示用，可省略
//   source        发送来源，默认 0；5 为群聊场景，需配合 groupid
//   groupid       群 id，仅 source=5 时需要
//   follow_source 关注来源埋点，默认 0
//   location      位置信息，默认空
//   nt            默认空
//   fakeid        官方助手/机器人会话身份 id，从收到的消息中原样回传
//   source_path   消息入口埋点（客户端会把它从 message 提取为外层 ingress），也可直接传 ingress
//   retry         重发标记，传 true 时请求体携带 retry: 1
//
// 陌生人限流：对方未关注且未回复前最多发 3 条打招呼消息（含历史发送），
// 额度内第 3 条起响应带 tip_content 提醒但消息仍送达；超限后 errcode=3006、status=0，消息被拒；
// 对方关注或回复后立即解锁，恢复后响应不再带 tip_content
module.exports = (params, useAxios) => {
  const tag = params?.tag || '';
  const tuid = Number(params?.tuid || 0);
  if (!tag && !tuid) {
    return Promise.reject({ status: 502, body: { status: 0, errcode: -1, error: 'tuid 与 tag 至少需要传一个' } });
  }

  const msgtype = Number(params?.msgtype || 201);
  const alert = params?.alert || '';
  if (msgtype === 201 && !alert) {
    return Promise.reject({ status: 502, body: { status: 0, errcode: -1, error: '文本消息缺少 alert 内容' } });
  }

  const message = {
    msgtype,
    alert,
    nickname: params?.nickname || '',
    source: Number(params?.source || 0),
    follow_source: Number(params?.follow_source || 0),
    location: params?.location || '',
    nt: params?.nt || '',
  };
  if (params?.groupid) message.groupid = Number(params.groupid);
  if (params?.fakeid) message.fakeid = String(params.fakeid);

  const sourcePath = params?.source_path || params?.ingress || '';
  const body = tag ? { tag } : { tuid };
  if (sourcePath) body.ingress = sourcePath;
  if (params?.retry) body.retry = 1;
  body.message = message;

  // 安卓端 org.json 序列化时会把值中的 / 转义为 \/，
  // 实际发送的请求体与参与签名的字节均为转义后的形式
  const data = JSON.stringify(body).split('/').join('\\/');

  return useAxios({
    url: '/v1/chat/send',
    method: 'post',
    data,
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
};
