// 对歌单内歌曲排序（自定义排序，可对「我喜欢」歌单使用）
// listid: 歌单 listid
// type: 歌单类型，0=自建/我喜欢，1=收藏
// list_ver: 歌单列表版本号（歌单歌曲接口返回的 list_ver）
// data: 排序数据，格式为 fileid|sort，多个用逗号分隔
module.exports = (params, useAxios) => {
  const userid = params?.userid || params?.cookie?.userid || 0;
  const token = params?.token || params?.cookie?.token || '';

  const resource = (params.data || '').split(',').map((s) => {
    const [fileid, sort] = s.split('|');
    return { fileid: Number(fileid), sort: Number(sort || 0) };
  });

  const dataMap = {
    listid: Number(params.listid),
    list_ver: Number(params.list_ver || 0),
    type: Number(params.type || 0),
    data: resource,
  };

  if (userid) dataMap['userid'] = userid;
  if (token) dataMap['token'] = token;

  return useAxios({
    url: '/v1/modify_song_sort',
    method: 'post',
    encryptType: 'android',
    data: dataMap,
    cookie: params?.cookie || {},
    headers: { 'x-router': 'cloudlist.service.kugou.com' },
  });
};
