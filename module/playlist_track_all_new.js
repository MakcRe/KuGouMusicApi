// 获取歌单所有歌曲（v3 已是最新版本，App 云歌单当前使用该端点）
module.exports = (params, useAxios) => {
  const userid = params?.userid || params?.cookie?.userid || '0';
  const token = params?.token || params?.cookie?.token || '0';
  const dataMap = {
    listid: params.listid,
    userid,
    type: Number(params.type || 0),
    page: Number(params.page || 1),
    pagesize: Number(params.pagesize || 300),
    area_code: 1,
    allplatform: 1,
    show_cover: 1,
    token,
  };

  return useAxios({
    url: '/v4/get_list_all_file_v3',
    method: 'post',
    encryptType: 'android',
    data: dataMap,
    cookie: params?.cookie || {},
    headers: { 'x-router': 'cloudlist.service.kugou.com' },
  });
};
