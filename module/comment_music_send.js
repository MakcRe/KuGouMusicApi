// 发送普通歌曲评论（code=fc4...，与歌曲弹幕池分离）
const commentMusic = require('./comment_music');
const { SONG_COMMENT_CODE, firstValue, badRequest, buildCommentSendConfig, extractResolvedResource } = require('./_comment');

module.exports = async (params, useAxios) => {
  if (!`${params.content || ''}`.trim()) {
    return badRequest('content 不能为空');
  }

  const mixsongid = firstValue(params.mixsongid, params.album_audio_id);
  let specialId = firstValue(params.special_id, params.childrenid, params.id);
  let name = firstValue(params.name, params.song_name, params.childrenname);

  if ((!specialId || !name) && mixsongid) {
    const lookupResponse = await commentMusic({ ...params, mixsongid, page: 1, pagesize: 1 }, useAxios);
    const resolved = extractResolvedResource(lookupResponse);
    specialId = specialId || resolved.id;
    name = name || resolved.name;
  }

  if (!specialId) {
    return badRequest('无法解析歌曲评论 special_id，请传入 mixsongid 或 special_id');
  }

  return useAxios(
    buildCommentSendConfig(
      {
        ...params,
        special_id: specialId,
        mixsongid,
        name,
      },
      SONG_COMMENT_CODE
    )
  );
};
