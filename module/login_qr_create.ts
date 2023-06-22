// 酷狗二维码生成
import { toDataURL } from 'qrcode';
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  return new Promise(async (resolve) => {
    const url = `https://h5.kugou.com/apps/loginQRCode/html/index.html?qrcode=${params.key}`
    return resolve({
      code: 200,
      status: 200,
      body: {
        code: 200,
        data: {
          url: url,
          base64: params?.qrimg ? await toDataURL(url) : '',
        },
      },
    })
  })
}

export default useModule;