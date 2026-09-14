// 修改「我的歌单」信息（名称/排序/标签/简介/封面）
// 使用云歌单服务加密协议（cloudlist.service.kugou.com）
// total_ver: 歌单总版本号（用户歌单接口返回的 total_ver）
// listid: 歌单 listid
// type: 歌单类别，0=自建/我喜欢，1=收藏
// name: 歌单名称（可选，缺省时不改动名称）
// sort: 歌单排序号
// tags: 歌单标签
// intro: 歌单简介
// pic: 自定义封面，格式为 custom/<FileName>（FileName 由 /playlist/pic/upload 返回）
const { createCloudRequest } = require('../util');

module.exports = (params, useAxios) => {
  const dataMap = {
    total_ver: Number(params.total_ver || 0),
    listid: Number(params.listid),
    type: Number(params.type || 0),
    sort: Number(params.sort || 0),
    tags: params.tags || '',
    intro: params.intro || '',
  };

  if (params.name) {
    dataMap.name = params.name;
  }

  if (params.pic) {
    dataMap.pic = params.pic;
  }

  return createCloudRequest({
    url: '/v1/modify_list',
    data: dataMap,
    cookie: params?.cookie || {},
  });
};
