// 获取音乐urls
// quality 支持 魔法音乐
// piano 钢琴
// acappella 人声 伴奏 分离
// subwoofer 乐器
// ancient 尤克里里
// dj dj
module.exports = (params, useAxios) => {
  const quality = ['piano', 'acappella', 'subwoofer', 'ancient', 'dj', 'surnay'].includes(params.quality)
    ? `magic_${params?.quality}`
    : params.quality;

  const dataMap = {
    album_audio_id: Number(params.album_audio_id ?? 0),
    area_code: 1,
    hash: params?.hash || '',
    vipType: params?.cookie?.vip_type || params?.vipType || 0, // 该参数不影响url获取
    vipToken: params?.cookie?.vip_token || params?.vipToken || '', // 该参数不影响url获取
    behavior: 'play',
    pid: 2,
    cmd: 26,
    version: 9541,
    pidversion: 3001,
    IsFreePart: params?.free_part ? 1 : 0, //是否返回试听部分（仅部分歌曲）
    album_id: Number(params.album_id ?? 0),
    ssa_flag: 'is_fromtrack',
    version: 11709,
    page_id: 151369488,
    quality: quality || 128,
    pid: 2,
    cmd: 26,
    ppage_id: '463467626,350369493,788954147',
    cdnBackup: 1,
    kcard: 0,
    module: 'collection',
  };

  return useAxios({
    url: '/v5/url',
    method: 'GET',
    params: dataMap,
    encryptType: 'android',
    headers: { 'x-router': 'tracker.kugou.com' },
    encryptKey: true,
    notSign: true,
    cookie: params?.cookie || {},
  });
};
