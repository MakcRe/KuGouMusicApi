// 获取音乐urls
module.exports = (params, useAxios) => {
  const dataMap = {
    hash: params?.hash || '',
    vipType: params?.cookie?.vip_type || params?.vipType || 0, // 该参数不影响url获取
    vipToken: params?.cookie?.vip_token || params?.vipToken || '', // 该参数不影响url获取
    behavior: 'play',
    pid: 2,
    cmd: 26,
    version: 9541,
    pidversion: 3001,
    IsFreePart: params?.free_part ? 1 : 0, //是否返回试听部分（仅部分歌曲）
  };

  return useAxios({
    url: '/v3/url',
    method: 'GET',
    params: dataMap,
    encryptType: 'android',
    headers: { 'x-router': 'tracker.kugou.com' },
    encryptKey: true,
    cookie: params?.cookie || {},
  });
};
