import axios from 'axios';
export const useModule = (params: UseModuleParams, useAxios: UseAxios) => {
  const answer: UseAxiosResponse = { status: 500, body: {}, cookie: [] };
  return new Promise<UseAxiosResponse>(async (resolve, reject) => {
    try {
      const resp = await axios({ url: `https://long.open.weixin.qq.com/connect/l/qrconnect?f=json&uuid=${params?.uuid || ''}` });

      answer.body = 200;
      answer.body = resp.data;

      resolve(answer);
    } catch (err) {
      answer.status = 502;
      answer.body = { status: 0, msg: err };
      reject(answer);
    }
  });
}

export default useModule;