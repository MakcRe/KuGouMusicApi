// 歌曲弹幕（与歌曲评论 code=fc4... 为不同评论池）
const { firstValue, badRequest, buildSongBarrageListConfig } = require('./_comment');

module.exports = (params, useAxios) => {
  const specialId = firstValue(params.special_id, params.childrenid, params.id);
  const hash = firstValue(params.hash, params.schash, params.extdata);

  if (!specialId && !hash) {
    return Promise.resolve(badRequest('special_id 和 hash 至少需要传入一个'));
  }

  return useAxios(buildSongBarrageListConfig(params));
};
