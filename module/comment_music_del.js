// 删除评论，支持歌曲、专辑和歌单评论池；传 tid 时删除楼层回复
const commentMusic = require('./comment_music');
const {
  firstValue,
  badRequest,
  buildCommentDelConfig,
  resolveCommentCode,
  extractResolvedResource,
} = require('./_comment');

module.exports = async (params, useAxios) => {
  const cid = firstValue(params.cid, params.comment_id);
  if (!cid) {
    return badRequest('cid（评论 ID）不能为空，可从评论列表接口获取');
  }

  const mixsongid = firstValue(params.mixsongid, params.album_audio_id);
  let specialId = firstValue(params.special_id, params.childrenid);

  if (!specialId && mixsongid) {
    const lookupResponse = await commentMusic({ ...params, mixsongid, page: 1, pagesize: 1 }, useAxios);
    specialId = extractResolvedResource(lookupResponse).id;
  }

  if (!specialId) {
    return badRequest('无法解析评论资源 special_id，请传入 special_id 或 mixsongid');
  }

  return useAxios(
    buildCommentDelConfig(
      {
        ...params,
        special_id: specialId,
        cid,
      },
      resolveCommentCode(params)
    )
  );
};
