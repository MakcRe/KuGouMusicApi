// 听书搜索
// 走标准版综合搜索 /complexsearch/v4/search/song（默认 host gateway.kugou.com，
// appid=1005 + 标准签名盐），返回 data.lists 章节列表；按 AlbumID 可聚合成有声书专辑。
// 注意：该端点要求必带 userid 参数（任意数字即可，酷狗对其归属不校验），
// 未登录 / 未传时兜底用 '0'，否则返回 error_code=152 Parameter Error。
module.exports = (params, useAxios) => {
  const dataMap = {
    area_code: 1,
    albumhide: 1,
    com_user_type: 0,
    privilegefilter: 0,
    dopicfull: 1,
    filter: 12,
    platform: 'AndroidFilter',
    tag: 'em',
    recver: 2,
    iscorrection: 1,
    search_ability: 223,
    sec_aggre: 1,
    sec_aggre_bitmap: 0,
    mode_ability: 1,
    nocollect: 1,
    user_type: 0,
    userid: params.userid ?? params.cookie?.userid ?? '0',
    keyword: params.keywords ?? params.keyword, // 兼容 keywords / keyword 两种写法
    page: Math.max(1, parseInt(params?.page) || 1),
    pagesize: Math.max(1, parseInt(params?.pagesize) || 30),
    clientver: 20789, // 覆盖为与官方 Android 客户端一致
  };

  return useAxios({
    url: '/complexsearch/v4/search/song',
    method: 'get',
    params: dataMap,
    encryptType: 'android',
    cookie: params?.cookie || {},
  });
};