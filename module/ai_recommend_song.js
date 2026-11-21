/**
 * AI 免费听推荐歌曲
 *
 * 对应酷狗概念版 AI 免费听推荐流，抓包接口：
 *   POST https://gateway.kugou.com/concepts/v1/ai/recommend_song
 *
 * source 来源（逆向佐证：发现页卡片 y_aisong 走 source=1 + pagesize=6；
 * 免费听主列表走 source=2）：
 *   1 = 发现页「AI免费听」卡片（DiscoveryCardProtocol 子请求）
 *   2 = AI 免费听列表（原实现默认）
 *
 * @param {Object} params
 * @param {number} [params.page] - 页码，默认 1
 * @param {number} [params.pagesize] - 每页数量，默认 30
 * @param {number} [params.source] - 推荐来源，默认 2；发现页卡片传 1
 * @param {Object} params.cookie - 登录态
 * @returns {Promise<{status: number, body: Object}>}
 */
module.exports = (params, useAxios) => {
  // HTTP query 传入的参数是字符串，此处请求体要求数值类型（字符串会报 errcode 20010 参数错误）
  const dataMap = {
    apiver: 2,
    source: Number(params?.source) || 2,
    pagesize: Number(params?.pagesize) || 30,
    page: Number(params?.page) || 1
  };

  return useAxios({
    url: '/concepts/v1/ai/recommend_song',
    data: dataMap,
    method: 'post',
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
};
