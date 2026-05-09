const {  mid, appid, clientver } = require('../util');

module.exports = (params, useAxios) => {
  const clienttime_ms = Math.floor(Date.now() / 1000);
  const dfid = params?.dfid || params.cookie?.dfid || '';
  const page_id = 667324467
  const ppage_id =  (params.ppage_id || '356753938,695084294,671299534')
    

  const dataMap = {
    dfid,
    appid,
    mid,
    clientver,
    clienttime: clienttime_ms,
    pagesize: params?.pagesize || 30,
    album_id: params.album_id,
    page: 1,
    fields: 'musical',
    is_buy: 0,
    page_id,
    ppage_id   
    
  };

  return useAxios({
    baseURL:'http://openapi.kugou.com',
    url: '/kmr/v1/album_songlist',
    method: 'POST',
    data: dataMap,
    encryptType: 'android',
    cookie: params?.cookie || {},
    headers: { 'KG-TID': '221'},
  });
};
