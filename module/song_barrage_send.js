// 发送歌曲弹幕；仅传 hash 时先查询并解析 special_id
const { firstValue, badRequest, buildSongBarrageListConfig, buildSongBarrageSendConfig, extractResolvedResource } = require('./_comment');

module.exports = async (params, useAxios) => {
  if (!`${params.content || ''}`.trim()) {
    return badRequest('content 不能为空');
  }

  let specialId = firstValue(params.special_id, params.childrenid, params.id);
  let name = firstValue(params.name, params.song_name, params.childrenname);

  if (!specialId) {
    const hash = firstValue(params.hash, params.schash, params.extdata);
    if (!hash) {
      return badRequest('special_id 和 hash 至少需要传入一个');
    }

    const lookupResponse = await useAxios(
      buildSongBarrageListConfig({
        ...params,
        page: 1,
        pagesize: 1,
      })
    );
    const resolved = extractResolvedResource(lookupResponse);
    specialId = resolved.id;
    name = name || resolved.name;
  }

  if (!specialId) {
    return badRequest('无法根据 hash 解析歌曲弹幕 special_id');
  }

  return useAxios(
    buildSongBarrageSendConfig({
      ...params,
      special_id: specialId,
      name,
    })
  );
};
