// 发送 MV 视频弹幕；仅传 hash 时先查询并解析 video_id
const { firstValue, badRequest, buildVideoBarrageListConfig, buildVideoBarrageSendConfig, extractResolvedResource } = require('./_comment');

module.exports = async (params, useAxios) => {
  if (!`${params.content || ''}`.trim()) {
    return badRequest('content 不能为空');
  }

  let videoId = firstValue(params.video_id, params.childrenid, params.id);
  let name = firstValue(params.name, params.video_name, params.childrenname);

  if (!videoId) {
    const hash = firstValue(params.hash, params.mvhash, params.extdata);
    if (!hash) {
      return badRequest('video_id 和 hash 至少需要传入一个');
    }

    const lookupResponse = await useAxios(
      buildVideoBarrageListConfig({
        ...params,
        page: 1,
        pagesize: 1,
      })
    );
    const resolved = extractResolvedResource(lookupResponse);
    videoId = resolved.id;
    name = name || resolved.name;
  }

  if (!videoId) {
    return badRequest('无法根据 hash 解析视频弹幕 video_id');
  }

  return useAxios(
    buildVideoBarrageSendConfig({
      ...params,
      video_id: videoId,
      name,
    })
  );
};
