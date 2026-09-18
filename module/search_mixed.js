const { cryptoMd5 } = require('../util');
// 综合搜索 (混合搜索)
// 概念版(lite) 使用 AndroidFilter 参数，versionCode 为 201
// 标准版保留原 IOSFilter 参数
module.exports = (params, useAxios) => {
  const time = Date.now();
  const isLite = process.env.platform === 'lite';

  const dataMap = isLite
    ? {
        keyword: params.keyword,
        platform: 'AndroidFilter',
        tag: 'em',
        area_code: params?.area_code || 1,
        iscorrection: params?.iscorrection ?? 1,
        cursor: params?.cursor || 0,
        apiver: 22,
        osversion: '15',
        ability: 1,
        clientver: params?.clientver || 201,
        vip_status: params?.vip_status || params?.cookie?.vip_type || 0,
      }
    : {
        ab_tag: 0,
        ability: 511,
        albumhide: 0,
        apiver: 22,
        area_code: 1,
        clientver: params?.clientver || 20125,
        cursor: 0,
        is_gpay: 0,
        iscorrection: 1,
        keyword: params.keyword,
        nocollect: 0,
        osversion: 16.5,
        platform: 'IOSFilter',
        recver: 2,
        req_ai: 1,
        requestid: `${cryptoMd5(`bdaa53d04e7475feb9024164a47032f9${time}`)}_0`,
        search_ability: 3,
        sec_aggre: 1,
        sec_aggre_bitmap: 0,
        style_type: 3,
        tag: 'em',
      };

  return useAxios({
    url: '/v3/search/mixed',
    method: 'GET',
    params: dataMap,
    encryptType: 'android',
    headers: { 'x-router': 'complexsearch.kugou.com', 'kg-clienttimems': time.toString() },
    cookie: params?.cookie || {},
  });
};
