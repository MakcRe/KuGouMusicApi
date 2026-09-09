const { appid, clientver, signParamsKey } = require('../util');

const COMMENT_HOST = 'm.comment.service.kugou.com';
const SONG_COMMENT_CODE = 'fc4be23b4e972707f36b8a828a93ba8a';
const ALBUM_COMMENT_CODE = '94f1792ced1df89aa68a7939eaf2efca';
const PLAYLIST_COMMENT_CODE = 'ca53b96fe5a1d9c22d71c8f522ef7c4f';
const SONG_BARRAGE_CODE = 'articulossong';
const VIDEO_BARRAGE_CODE = 'db3664c219a6e350b00ab08d7f723a79';

const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && `${value}` !== '');

const compact = (object) =>
  Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null && (typeof value !== 'string' || value !== ''))
  );

const badRequest = (message) => ({
  status: 400,
  body: {
    status: 0,
    error_code: 400,
    msg: message,
  },
  cookie: [],
  headers: {},
});

const getIdentity = (params = {}) => {
  const cookie = params.cookie || {};
  const clienttime = Number(firstValue(params.clienttime, Math.floor(Date.now() / 1000)));
  const mid = `${firstValue(params.mid, cookie.KUGOU_API_MID) ?? ''}`;
  const token = `${firstValue(params.clienttoken, params.token, cookie.token) ?? ''}`;
  const userid = firstValue(params.kugouid, params.userid, cookie.userid, 0);
  const dfid = `${firstValue(params.dfid, cookie.dfid, '-')}`;
  const uuid = `${firstValue(params.uuid, cookie.uuid, '-')}`;

  return { clienttime, mid, token, userid, dfid, uuid };
};

const getListAuthParams = (params = {}) => {
  const { clienttime, mid, token, userid, dfid, uuid } = getIdentity(params);

  return {
    kugouid: userid,
    ver: firstValue(params.ver, 6),
    clienttoken: token,
    appid,
    clientver,
    mid,
    clienttime,
    key: signParamsKey(`${clienttime}`),
    uuid,
    dfid,
  };
};

const commentRequestConfig = (params, query, method = 'GET', data) => ({
  url: '/index.php',
  method,
  params: compact(query),
  data,
  cookie: params?.cookie || {},
  clearDefaultParams: true,
  notSignature: true,
  headers: compact({
    'x-router': COMMENT_HOST,
    'Content-Type': data ? 'application/json; charset=UTF-8' : undefined,
  }),
});

const buildSongBarrageListConfig = (params = {}) => {
  const specialId = firstValue(params.special_id, params.childrenid, params.id);
  const hash = firstValue(params.hash, params.schash, params.extdata);

  return commentRequestConfig(params, {
    r: 'comments/getCommentWithLike',
    code: SONG_BARRAGE_CODE,
    childrenid: specialId,
    extdata: specialId ? undefined : hash,
    childrenname: firstValue(params.name, params.song_name, params.childrenname),
    mixsongid: firstValue(params.mixsongid, params.album_audio_id),
    p: firstValue(params.page, params.p, 1),
    pagesize: firstValue(params.pagesize, 20),
    ...getListAuthParams(params),
  });
};

const buildVideoBarrageListConfig = (params = {}) => {
  const videoId = firstValue(params.video_id, params.childrenid, params.id);
  const hash = firstValue(params.hash, params.mvhash, params.extdata);

  return commentRequestConfig(params, {
    r: 'comments/getCommentWithLike',
    code: VIDEO_BARRAGE_CODE,
    childrenid: videoId,
    extdata: videoId ? undefined : hash,
    childrenname: firstValue(params.name, params.video_name, params.childrenname),
    p: firstValue(params.page, params.p, 1),
    pagesize: firstValue(params.pagesize, 20),
    ...getListAuthParams(params),
  });
};

const buildCommentSendConfig = (params = {}, code) => {
  const { clienttime, mid, token, userid, dfid, uuid } = getIdentity(params);
  const contentData = compact({
    content: params.content,
    album_audio_id: firstValue(params.mixsongid, params.album_audio_id),
    title: params.title,
    extdata: params.content_extdata,
    images: Array.isArray(params.images) ? params.images : [],
  });
  const data = JSON.stringify({ data: contentData });

  return commentRequestConfig(
    params,
    {
      r: 'commentsv3/add',
      code,
      childrenid: firstValue(params.special_id, params.childrenid, params.id),
      childrenname: firstValue(params.name, params.song_name, params.album_name, params.playlist_name, params.childrenname),
      kugouid: userid,
      ver: firstValue(params.ver, 6),
      clienttoken: token,
      appid,
      clientver,
      mid,
      clienttime,
      key: signParamsKey(`${clienttime}${mid}${data}`),
      uuid,
      dfid,
      source: params.source,
    },
    'POST',
    data
  );
};

const buildSongBarrageSendConfig = (params = {}) => buildCommentSendConfig(params, SONG_BARRAGE_CODE);

const buildCommentReplyConfig = (params = {}, code) => {
  const { clienttime, mid, token, userid, dfid, uuid } = getIdentity(params);
  const pid = firstValue(params.pid, 0);
  const isTopLevelReply = firstValue(params.is_t, params.isT, `${pid}` === '0' ? 1 : 0);
  const replyUserName = firstValue(params.reply_user_name, params.puser);
  const replyContent = firstValue(params.reply_content, params.pcontent);
  const content =
    replyUserName && replyContent && !`${params.content}`.includes('//@') ? `${params.content}//@${replyUserName}:${replyContent}` : params.content;

  return commentRequestConfig(
    params,
    {
      r: 'commentsv2/reply',
      code,
      childrenid: firstValue(params.special_id, params.childrenid, params.id),
      childrenname: firstValue(params.name, params.song_name, params.album_name, params.playlist_name, params.childrenname),
      kugouid: userid,
      ver: firstValue(params.ver, 6),
      clienttoken: token,
      appid,
      clientver,
      mid,
      clienttime,
      key: signParamsKey(`${clienttime}${mid}`),
      uuid,
      dfid,
      extdata: params.extdata,
      content,
      tid: params.tid,
      is_t: isTopLevelReply,
      pid,
      source: params.source,
    },
    'POST'
  );
};

const buildVideoBarrageSendConfig = (params = {}) => {
  const { mid, token, userid } = getIdentity(params);

  return commentRequestConfig(params, {
    r: 'comments/addcomment',
    code: VIDEO_BARRAGE_CODE,
    childrenid: firstValue(params.video_id, params.childrenid, params.id),
    childrenname: firstValue(params.name, params.video_name, params.childrenname),
    ver: firstValue(params.ver, '1.02'),
    content: params.content,
    pid: params.pid,
    clientver,
    mid,
    clienttoken: token,
    kugouid: userid,
    appid,
  });
};

const extractResolvedResource = (response = {}) => {
  const body = response.body || {};
  const first = Array.isArray(body.list) ? body.list[0] || {} : {};

  return {
    id: firstValue(body.childrenid, first.special_child_id),
    name: firstValue(first.special_child_name, first.song_show_text),
  };
};

module.exports = {
  SONG_COMMENT_CODE,
  ALBUM_COMMENT_CODE,
  PLAYLIST_COMMENT_CODE,
  SONG_BARRAGE_CODE,
  VIDEO_BARRAGE_CODE,
  firstValue,
  badRequest,
  buildSongBarrageListConfig,
  buildVideoBarrageListConfig,
  buildCommentSendConfig,
  buildCommentReplyConfig,
  buildSongBarrageSendConfig,
  buildVideoBarrageSendConfig,
  extractResolvedResource,
};
