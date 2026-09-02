const { appid, srcappid, clientver } = require('../util')

// 使用当前已登录账号授权二维码对应的新设备登录。
// qrcode 是二维码 key，从新设备登录二维码中提取，cookie 中必须包含当前账号的 token、userid
// appid 为可选参数，不做校验，未传时直接使用当前平台配置的 appid；
// 无论是否传入，最终请求的 appid 必须与当前 token 对应平台一致
// 而非二维码所属端的 appid，否则上游会返回 error_code 20018
module.exports = (params, useAxios) => {
  const qrcode = params?.qrcode
  if (!qrcode || !/^[\w-]+$/.test(qrcode)) {
    return Promise.reject({
      status: 400,
      body: { status: 0, error_code: 400, msg: '缺少有效的 qrcode 参数' },
      cookie: [],
    })
  }

  const cookie = params?.cookie || {}
  if (!cookie.token || !cookie.userid) {
    return Promise.reject({
      status: 400,
      body: { status: 0, error_code: 400, msg: 'cookie 中缺少已登录账号的 token 或 userid' },
      cookie: [],
    })
  }

  // appid 为可选参数，不做校验，未传时直接使用当前平台配置的 appid
  const requestAppid = params?.appid || appid

  // 与线上 H5 (loginQRCode) 的 kGRequest 请求保持一致：
  // 查询参数 appid/clientver/clienttime/mid/uuid/dfid 由 createRequest 注入，
  // 请求体仅包含 plat/userid/token/qrcode/type，签名会包含该请求体字符串。
  const requestOptions = {
    baseURL: 'https://login-user.kugou.com',
    method: 'POST',
    params: {
      appid: requestAppid,
      srcappid,
      clientver,
    },
    data: JSON.stringify({
      plat: params?.plat === 2 ? 2 : 1,
      userid: cookie.userid,
      token: cookie.token,
      qrcode,
      type: 1,
    }),
    headers: { 'Content-Type': 'application/json' },
    encryptType: 'web',
    cookie,
  }

  // H5 页面先调用 scan 登记扫码行为，确认后再调用 authorize 完成授权。
  return useAxios({ ...requestOptions, url: '/v2/scan' }).then((scanResponse) => {
    const scanData = scanResponse.body?.data
    if (scanResponse.body?.status !== 1 || String(scanData?.userid) !== String(cookie.userid)) {
      return {
        ...scanResponse,
        body: {
          ...scanResponse.body,
          data: {
            ...scanData,
            qrcode,
            appid: requestAppid,
            authorized: false,
          },
        },
      }
    }

    return useAxios({ ...requestOptions, url: '/v2/authorize' }).then((authorizeResponse) => ({
      ...authorizeResponse,
      body: {
        ...authorizeResponse.body,
        data: {
          ...authorizeResponse.body?.data,
          qrcode,
          appid: requestAppid,
          authorized:
            authorizeResponse.body?.status === 1 &&
            String(authorizeResponse.body?.data?.userid) === String(cookie.userid),
        },
      },
    }))
  })
}
