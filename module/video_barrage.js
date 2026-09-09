// MV 视频弹幕（底层复用 MV 评论池）
const { firstValue, badRequest, buildVideoBarrageListConfig } = require('./_comment');

module.exports = (params, useAxios) => {
  const videoId = firstValue(params.video_id, params.childrenid, params.id);
  const hash = firstValue(params.hash, params.mvhash, params.extdata);

  if (!videoId && !hash) {
    return Promise.resolve(badRequest('video_id 和 hash 至少需要传入一个'));
  }

  return useAxios(buildVideoBarrageListConfig(params));
};
