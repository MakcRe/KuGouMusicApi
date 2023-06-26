// 热门好歌精选
// song_module_1 card_id_1: 精选好歌随心听 || 私人专属好歌
// song_module_2 card_id_2: 经典怀旧金曲
// song_module_3 card_id_3:  热门好歌精选
// song_module_4 card_id_4: 小众宝藏佳作
// song_module_6 card_id_6: vip专属推荐

import { mapToObject } from '../util/util';
import { signParamsKey } from '../util/helper';
import { cryptoMd5 } from '../util/crypto';

export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const dataMap = new Map();
  const dfid = params?.dfid || params?.cookie?.dfid || '-';
  const fakem = '60f7ebf1f812edbac3c63a7310001701760f';

  dataMap.set('appid', 1005);
  dataMap.set('clientver', 11669);
  dataMap.set('platform', 'android');
  dataMap.set('clienttime', Date.now());
  dataMap.set('userid', params?.userid || params?.cookie?.userid || 0);
  dataMap.set('key', signParamsKey(dataMap.get('clienttime')));
  dataMap.set('fakem', fakem);
  dataMap.set('area_code', 1);
  dataMap.set('mid', cryptoMd5(dfid));
  dataMap.set('uuid', cryptoMd5(`${dfid}${dataMap.get('mid')}`));
  dataMap.set('client_playlist', []);
  dataMap.set('u_info', 'a0c35cd40af564444b5584c2754dedec');

  return useAxios({
    url: '/singlecardrec.service/v1/single_card_recommend',
    encryptType: 'android',
    method: 'POST',
    data: mapToObject(dataMap),
    params: { 'card_id': params?.card_id || 1, fakem, area_code: 1, platform: 'android' },
    cookie: params?.cookie || {},
  })
}

export default useModule;