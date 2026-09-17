// 获取IP位置
const { cryptoMd5 } = require('../util')

module.exports = (params, useAxios) => {
  const ip = params?.ip || ''
  const mid = String(params?.mid || params?.cookie?.KUGOU_API_MID || '')
  const uuid = String(params?.uuid || params?.cookie?.uuid || '-')
  const dfid = String(params?.dfid || params?.cookie?.dfid || '-')
  const appid = String(params?.appid || '3116')
  const clientver = String(params?.clientver || '10672')
  const clienttime = String(Math.floor(Date.now() / 1000))

  const requestParams = {
    _t: String(Date.now()),
    apiver: '2',
    appid,
    clienttime,
    clientver,
    dfid,
    mid,
    plat: String(params?.plat || '1070'),
    token: '',
    type: '1',
    uuid,
    uuidtype: '0',
    version: String(params?.version || '10672'),
  }

  const sigSalt = 'LnT6xpN3khm36zse0QzvmgTZ3waWdRSA'
  const sortedKeys = Object.keys(requestParams).sort()
  let sigStr = ''
  for (const k of sortedKeys) sigStr += k + '=' + requestParams[k]
  const signature = cryptoMd5(sigSalt + sigStr + sigSalt)

  return useAxios({
    baseURL: 'http://ip2.kugou.com',
    url: '/api/v1/overseas/check_v2',
    method: 'GET',
    params: {
      ...requestParams,
      signature,
    },
    notSignature: true,
    clearDefaultParams: true,
    realIP: ip || undefined,
    cookie: params?.cookie || {},
  })
}
