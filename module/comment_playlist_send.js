// 发送歌单评论
const commentPlaylist = require('./comment_playlist');
const { PLAYLIST_COMMENT_CODE, firstValue, badRequest, buildCommentSendConfig, extractResolvedResource } = require('./_comment');

module.exports = async (params, useAxios) => {
  if (!`${params.content || ''}`.trim()) {
    return badRequest('content 不能为空');
  }

  const playlistId = firstValue(params.playlist_id, params.special_id, params.childrenid, params.id);
  if (!playlistId) {
    return badRequest('id 不能为空');
  }

  let name = firstValue(params.name, params.playlist_name, params.childrenname);
  if (!name) {
    const lookupResponse = await commentPlaylist({ ...params, id: playlistId, page: 1, pagesize: 1 }, useAxios);
    name = extractResolvedResource(lookupResponse).name;
  }

  return useAxios(
    buildCommentSendConfig(
      {
        ...params,
        special_id: playlistId,
        name,
      },
      PLAYLIST_COMMENT_CODE
    )
  );
};
