// 内容黑名单查询（获取已屏蔽的歌曲或歌手列表）
//
// 协议说明（已验证）：
//  - label 区分黑名单类型：'song'（歌曲）| 'singer'（歌手）
//  - source 与 label 绑定：song -> 3，singer -> 4
//  - page / pagesize 分页参数，客户端单页上限 500；翻页至 total / pagesize 为止可取全量
//  - 返回条目：歌曲为 { song_k: FileHash, song_v: '{"n":名称,"m":mixsongid,"t":时间}', t }，
//    歌手为 { singer_k: singerid, singer_v: '{"n":歌手名,"t":时间}', t }
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

  const dataMap = {
    userid,
    source: Number(params?.source || SOURCE_MAP[label]),
    label,
    p: cryptoRSAEncrypt(JSON.stringify({ clienttime, token })),
    page: Number(params?.page || 1),
    pagesize: Math.min(Number(params?.pagesize || 30), 500),
  };

  return useAxios({
    baseURL: 'https://relationuser.kugou.com',
    url: '/v2/get_list_items',
    method: 'POST',
    data: dataMap,
    cookie: params?.cookie || {},
    headers: { 'KG-TID': String(params?.moduleId || 473) },
    encryptType: 'android',
  });
};
