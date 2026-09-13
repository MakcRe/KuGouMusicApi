// 对「我的歌单」列表排序（自建歌单/收藏歌单）
// total_ver: 歌单总版本号（用户歌单接口返回的 total_ver）
// type: 歌单类别，0=自建歌单，1=收藏歌单（sort 按类别分开编号）
// data: 排序数据，格式为 listid|type|sort，多个用逗号分隔
module.exports = (params, useAxios) => {
  const userid = params?.userid || params?.cookie?.userid || 0;
  const token = params?.token || params?.cookie?.token || '';

  const resource = (params.data || '').split(',').map((s) => {
    const [listid, type, sort] = s.split('|');
    return { listid: Number(listid), type: Number(type || 0), sort: Number(sort || 0) };
  });

  const dataMap = {
    total_ver: Number(params.total_ver || 0),
    data: resource,
  };

  if (userid) dataMap['userid'] = userid;
  if (token) dataMap['token'] = token;

  return useAxios({
    url: '/v1/modify_list_sort',
    method: 'post',
    encryptType: 'android',
    data: dataMap,
    cookie: params?.cookie || {},
    headers: { 'x-router': 'cloudlist.service.kugou.com' },
  });
};
