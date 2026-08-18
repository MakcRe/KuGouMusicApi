// 内容黑名单编辑（添加/移除屏蔽的歌曲或歌手）
//
// 协议说明（已验证）：
//  - label 区分黑名单类型：'song'（歌曲）| 'singer'（歌手）
//  - source 与 label 绑定：song -> 3，singer -> 4（其他值服务端报"错误来源/错误标签"）
//  - items 为 [{ k, v }] 结构：
//      歌曲：k = FileHash（小写），v = JSON 字符串 {"n":"歌手 - 歌名","m":"mixsongid","t":"秒级时间戳"}
//      歌手：k = singerid 字符串，v = JSON 字符串 {"n":"歌手名","t":"秒级时间戳"}
//  - p 为 RSA 加密的 {"clienttime":秒,"token":"<token>"}，不可附加其他字段
//  - 使用默认参数集 + android 签名（无需 clearDefaultParams）
//  - KG-TID 按场景取值：473 黑名单管理（默认）、474 猜你喜欢、18 每日推荐、30 主题歌单
//  - 响应以 status == 1 判定成功（error_code 为失败码）
const { cryptoRSAEncrypt } = require('../util');

const SOURCE_MAP = { song: 3, singer: 4 };

module.exports = (params, useAxios) => {
  const token = params?.token || params?.cookie?.token || '';
  const userid = Number(params?.userid || params?.cookie?.userid || 0);
  const clienttime = Math.floor(Date.now() / 1000);
  const label = params?.label === 'singer' ? 'singer' : 'song';
  const timestamp = String(clienttime);

  // 支持直接传 items（[{k,v}] 结构，批量场景），或传简化参数由本模块构建
  let items = params?.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (e) {
      items = undefined;
    }
  }
  if (!Array.isArray(items) || items.length === 0) {
    if (label === 'song') {
      // hash: 歌曲 FileHash；mixsongid: 歌曲 MixSongID；name: "歌手 - 歌名"
      items = [
        {
          k: String(params?.hash || '').toLowerCase(),
          v: JSON.stringify({ n: params?.name || '', m: String(params?.mixsongid || ''), t: timestamp }),
        },
      ];
    } else {
      // singerid: 歌手 ID；name: 歌手名
      items = [
        {
          k: String(params?.singerid || ''),
          v: JSON.stringify({ n: params?.name || '', t: timestamp }),
        },
      ];
    }
  }

  const dataMap = {
    userid,
    source: Number(params?.source || SOURCE_MAP[label]),
    label,
    items,
    action: params?.isDelete ? 'delete' : 'add',
    p: cryptoRSAEncrypt(JSON.stringify({ clienttime, token })),
  };

  return useAxios({
    baseURL: 'https://relationuser.kugou.com',
    url: '/v1/edit_list_items',
    method: 'POST',
    data: dataMap,
    cookie: params?.cookie || {},
    headers: { 'KG-TID': String(params?.moduleId || 473) },
    encryptType: 'android',
  });
};
