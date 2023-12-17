// 收藏歌单
module.exports = (params, useAxios) => {
  const userid = params?.userid || params?.cookie?.userid || 0;
  const token = params?.token || params.cookie?.token || '';
  const clienttime = Math.floor(Date.now() / 1000);

  const dataMap = {
    userid,
    token,
    total_ver: 0,
    name: params.name,
    type: 1,
    source: params.source || 1,
    is_pri: 0,
    list_create_userid: params.list_create_userid,
    list_create_gid: params.list_create_gid || '',
    list_create_listid: params.list_create_listid,
    from_shupinmv: 0,
  };

  return useAxios({
    url: '/cloudlist.service/v5/add_list',
    data: dataMap,
    params: { last_time: clienttime, last_area: 'gztx', userid, token },
    method: 'post',
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
};
