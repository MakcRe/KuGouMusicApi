// 搜索
module.exports = (params, useAxios) => {
  const dataMap = {
    platform: 'AndroidFilter',
    keyword: params?.keywords || '',
    page: params?.page || 1,
    pagesize: params?.pagesize || 30,
    category: 1,
  };

  const type = ['special', 'lyric', 'song', 'album', 'author', 'mv'].includes(params.type) ? params.type : 'song';

  return useAxios({
    url: `/${type === 'song' ? 'v2' : 'v1'}/search/${type}`,
    method: 'GET',
    params: dataMap,
    encryptType: 'android',
    headers: { 'x-router': 'complexsearch.kugou.com' },
    cookie: params?.cookie || {},
  });
};
