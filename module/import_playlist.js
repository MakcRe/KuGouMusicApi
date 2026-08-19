const { appid, clientver, liteAppid, liteClientver } = require('../util/config.json');

const GATEWAY_BASE = 'https://gateway.kugou.com';

const parseBody = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  return body;
};

const parseIds = (value) => {
  if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(Number).filter(Number.isFinite);
    } catch {}
    return value.split(',').map(Number).filter(Number.isFinite);
  }
  const id = Number(value);
  return Number.isFinite(id) ? [id] : [];
};

module.exports = (params, useAxios) => {
  const input = { ...params, ...parseBody(params?.body) };
  const cookie = params?.cookie || {};
  const userid = String(input.userid || cookie.userid || '');
  const token = input.token || cookie.token || '';
  const operation = input.operation;
  const isLite = process.env.platform === 'lite';
  const clienttime = Math.floor(Date.now() / 1000);

  const query = {
    appid: String(isLite ? liteAppid : appid),
    clientver: String(isLite ? liteClientver : clientver),
    clienttime: String(clienttime),
    mid: String(input.mid || cookie.KUGOU_API_MID || '-'),
    uuid: String(input.uuid || cookie.uuid || '-'),
    dfid: String(input.dfid || cookie.dfid || '-'),
  };

  const common = {
    baseURL: GATEWAY_BASE,
    method: 'POST',
    params: query,
    cookie,
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    encryptType: 'android',
    clearDefaultParams: true,
  };

  if (operation === 'add_task') {
    const taskType = Number(input.task_type || 0);
    const data = { userid, token, source: Number(input.source || 3), task_type: taskType };
    if (taskType === 0) {
      data.url = String(input.url || '');
    } else {
      data.listid = Number(input.listid || 0);
      if (input.list_name) data.list_name = String(input.list_name);
      data.task_sn = String(input.task_sn || `${userid}${Date.now()}`);
    }
    return useAxios({ ...common, url: '/assetservice/import/v1/add_task', data });
  }

  if (operation === 'submit_img') {
    const imgBase64 = String(input.img_base64 || '').replace(/^data:image\/[^;]+;base64,/, '');
    return useAxios({
      ...common,
      url: '/assetservice/import/v1/submit_img',
      data: { userid, token, img_base64: imgBase64, task_sn: String(input.task_sn || '') },
    });
  }

  if (operation === 'task_count') {
    return useAxios({
      ...common,
      url: '/assetservice/import/v1/task_count',
      data: { userid, token, classify: Number(input.classify || 1) },
    });
  }

  if (operation === 'query_task_status') {
    return useAxios({
      ...common,
      url: '/assetservice/import/v1/query_task_status',
      data: { userid, token, ids: parseIds(input.ids) },
    });
  }

  if (operation === 'query_task') {
    return useAxios({
      ...common,
      url: '/pubsongs/v1/query_task',
      data: {
        userid,
        token,
        listid: String(input.listid || ''),
        page: Math.max(1, Number(input.page || 1)),
        pagesize: Math.max(1, Number(input.pagesize || 30)),
        show_missed: Number(input.show_missed ?? 1) ? 1 : 0,
      },
    });
  }

  return Promise.reject({
    status: 400,
    body: { status: 0, error_code: 400, error_msg: `不支持的操作: ${operation || ''}` },
  });
};
