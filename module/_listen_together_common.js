const YOUTH_BASE = 'https://youth.kugou.com';
const GATEWAY_BASE = 'https://gateway.kugou.com';
const SELF_STUDY_BIZ = '1000';
const MUSIC_ROOM_BIZ = '1009';
const DEFAULT_MUSIC_ROOM_BG =
  'https://youthimgbssdl.kugou.com/6e9cdcef8d163d06225d8cbeaa2f1ece.JPEG';

const parseJsonValue = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parseObject = (value, fallback = {}) => {
  const parsed = parseJsonValue(value, fallback);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
};

const parseArray = (value) => {
  const parsed = parseJsonValue(value, []);
  return Array.isArray(parsed) ? parsed : [];
};

const authBody = (params) => ({
  userid: Number(params?.userid || params?.cookie?.userid || 0),
  token: params?.token || params?.cookie?.token || '',
});

const musicRoomAudios = (params) =>
  parseArray(params?.audios)
    .slice(0, 50)
    .map((audio) => ({
      hash: audio?.hash || '',
      mixsongid: audio?.mixsongid ?? audio?.mixSongId ?? '',
      fid: audio?.fid ?? 0,
    }))
    .filter((audio) => audio.hash);

const createDomainHandler = (operations) => (params, useAxios) => {
  // IPC POST 数据位于 body，HTTP 调用也可能把简单参数放在 query；领域模块统一读取。
  const body = parseObject(params?.body);
  const input = { ...params, ...body, cookie: params?.cookie || {} };
  const operation = input.operation;
  const config = operations[operation];
  if (!config) {
    return Promise.reject({
      status: 400,
      body: { status: 0, error_code: 400, error_msg: `不支持的操作: ${operation || ''}` },
    });
  }

  const options = {
    baseURL: config.baseURL || YOUTH_BASE,
    url: config.url,
    method: config.method,
    encryptType: 'android',
    cookie: { ...(input.cookie || {}) },
  };
  if (config.params) options.params = config.params(input);
  if (config.data) options.data = config.data(input);
  else if (config.method === 'POST') options.data = {};
  return useAxios(options);
};

module.exports = {
  DEFAULT_MUSIC_ROOM_BG,
  GATEWAY_BASE,
  MUSIC_ROOM_BIZ,
  SELF_STUDY_BIZ,
  YOUTH_BASE,
  authBody,
  createDomainHandler,
  musicRoomAudios,
  parseArray,
  parseObject,
};
