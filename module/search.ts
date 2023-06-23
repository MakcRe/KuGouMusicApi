// 搜索
import { mapToObject } from '../util/util';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  dataMap.set('platform', 'AndroidFilter');
  dataMap.set('keyword', params?.keyword || '');
  dataMap.set('page', params?.page || 1);
  dataMap.set('pagesize', params?.pagesize || 30);
  dataMap.set('category', 1);

  const type = ['special', 'lyric', 'song', 'album', 'author', 'mv'].includes(params.type) ? params.type : 'song';

  return useAxios({
    url: `/${type === 'song' ? 'v2' : 'v1'}/search/${type}`,
    method: 'GET',
    params: mapToObject(dataMap),
    encryptType: 'android',
    headers: { 'x-router': 'complexsearch.kugou.com' },
    cookie: params?.cookie || {},
  });
}

export default useModule;