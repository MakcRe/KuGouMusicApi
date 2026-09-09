// 发送专辑评论
const commentAlbum = require('./comment_album');
const { ALBUM_COMMENT_CODE, firstValue, badRequest, buildCommentSendConfig, extractResolvedResource } = require('./_comment');

module.exports = async (params, useAxios) => {
  if (!`${params.content || ''}`.trim()) {
    return badRequest('content 不能为空');
  }

  const albumId = firstValue(params.album_id, params.special_id, params.childrenid, params.id);
  if (!albumId) {
    return badRequest('id 不能为空');
  }

  let name = firstValue(params.name, params.album_name, params.childrenname);
  if (!name) {
    const lookupResponse = await commentAlbum({ ...params, id: albumId, page: 1, pagesize: 1 }, useAxios);
    name = extractResolvedResource(lookupResponse).name;
  }

  return useAxios(
    buildCommentSendConfig(
      {
        ...params,
        special_id: albumId,
        name,
      },
      ALBUM_COMMENT_CODE
    )
  );
};
