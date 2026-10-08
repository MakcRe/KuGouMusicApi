// 获取音乐详情（模块路由 /privilege/lite）
// 接口：POST https://gateway.kugou.com/v2/get_res_privilege/lite（x-router: media.store.kugou.com）
//
// 参数：
//   hash        音乐 hash（必填，可传多个以逗号分隔）
//   album_id    专辑 id（可选，多个以逗号分隔，与 hash 顺序对应）
//   album_audio_id  专辑音频 id（可选，仅用于输出回显，不参与上游请求，原因见下方 resource 注释）
//   qualities   需要判断的音质，逗号分隔，默认 128,320,flac,high,viper_tape,viper_clear,viper_atmos，传 all 表示全部
//
// 数据来源：酷狗 mediastore 权益接口的 relate_goods（每个音质一条权益记录）
//   level       2=128、4=320、5=flac、6=Hi-Res、7=DSD，其它音质（蝰蛇/多轨等）为 0
//   privilege   0 表示免费可获取，非 0 表示需要会员/付费（实测付费歌曲为 10 且 pay_type=3）
//   status      1 可播，0 不可播；fail_process 为上游的失败原因码
const { appid, clientver } = require('../util');

// 音质由低到高（用于在同 level 的特殊音质之间排序）
const QUALITY_ORDER = ['128', '320', 'flac', 'high', 'super', 'viper_clear', 'viper_tape', 'viper_atmos', 'multitrack'];

// 音质所需会员类型：suvip=超级VIP（概念版 VIP、tvip 不可播放），concept=概念版 VIP 即可获取
// 蝰蛇母带(viper_tape) 需要超级VIP 才能播放；蝰蛇超清、蝰蛇全景声实测概念版VIP 账号同样拿不到 url，
// 一并按超级VIP 处理（免费歌曲不受限，上游会返回待转码的源文件）
const QUALITY_VIP_TYPE = { viper_tape: 'suvip', viper_clear: 'suvip', viper_atmos: 'suvip' };

// 上游一次请求的音质列表：完整请求才能拿到 128 的 ogg 条目，
// 输出时再按 qualities 参数过滤
const UPSTREAM_QUALITIES = ['128', '320', 'flac', 'high', 'viper_atmos', 'viper_tape', 'viper_clear', 'super', 'multitrack'];

// 音质对应的 relate_goods level，用于在重复条目中挑选概念版实际使用的那个
// 128 优先 level=1（概念版播放的 ogg 版本，音量大小与客户端弹窗一致），其次 level=2（mp3 版本）
const QUALITY_LEVEL = { 128: [1, 2], 320: [4], flac: [5], high: [6], super: [7] };

// 音量大小格式化：与客户端弹窗一致，≥1M 用 M、否则用 K，均保留 1 位小数
const formatSize = (bytes) => {
  if (!bytes || bytes <= 0) return '';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}G`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}M`;
  return `${(bytes / 1024).toFixed(1)}K`;
};

// 在 relate_goods 中挑选指定音质的权益条目
const pickRelate = (relateGoods, quality) => {
  for (const level of QUALITY_LEVEL[quality] || []) {
    const hit = relateGoods.find((item) => item.level === level && item.quality === quality);
    if (hit) return hit;
  }
  return relateGoods.find((item) => item.quality === quality);
};

// 概念版播放的标准音质(128)/高品质音质(320)是 ogg 版本（/song/url 请求带 need_ogg=1），
// 资源 hash 与文件大小取自 trans_param.ogg_128_hash / ogg_128_filesize（客户端弹窗显示的就是这个大小），
// 无损及以上没有 ogg 版本，直接用 relate_goods 条目里的信息；上游偶尔会额外返回 level=1 的 ogg 条目，二者一致
const oggOf = (quality, resource) => {
  const transParam = resource?.trans_param || {};
  if (quality === '128') return { hash: transParam.ogg_128_hash, size: transParam.ogg_128_filesize };
  if (quality === '320') return { hash: transParam.ogg_320_hash, size: transParam.ogg_320_filesize };
  return {};
};

// 把一个 hash 的上游权益数据整理成归一化判断结果
const buildQualityVip = (hash, albumId, albumAudioId, resource, qualities, isLite) => {
  const relateGoods = Array.isArray(resource?.relate_goods) ? resource.relate_goods : [];

  const list = qualities.map((quality) => {
    const relateItem = pickRelate(relateGoods, quality);
    // 上游是否提供该音质（没有该音质的歌曲不会出现在 relate_goods 里）
    const exists = Boolean(relateItem);
    // 是否需要会员/付费：以上游 privilege 为准（0 表示免费）
    const neesuvip = exists && relateItem.privilege !== 0;
    // 概念版「免费听」：付费/会员歌曲下，非 VIP 用户仍可获取标准音质（仅概念版生效）
    const freeListen = isLite && quality === '128' && neesuvip;
    // 是否可免 VIP 获取：免费歌曲的可播音质，或概念版免费听拿到的标准音质
    const obtainable = freeListen || (exists && !neesuvip && relateItem.status !== 0);
    // 128/320 优先用 ogg 版本（概念版实际播放的资源）
    const ogg = oggOf(quality, resource);
    const size = exists ? ogg.size || relateItem?.info?.filesize || 0 : 0;

    return {
      quality,
      exists,
      level: relateItem?.level ?? 0,
      bitrate: relateItem?.info?.bitrate ?? 0,
      extname: exists ? (ogg.hash ? 'ogg' : relateItem?.info?.extname ?? '') : '',
      hash: exists ? ogg.hash || relateItem?.hash || '' : '',
      size,
      size_text: formatSize(size),
      privilege: relateItem?.privilege ?? -1,
      status: relateItem?.status ?? 0,
      pay_type: relateItem?.pay_type ?? -1,
      price: relateItem?.price ?? 0,
      fail_process: relateItem?.fail_process ?? 0,
      need_vip: neesuvip,
      obtainable,
      free_listen: freeListen,
      // 该音质需要的会员类型（仅 VIP 受限音质有值）：suvip=超级VIP（概念版VIP、tvip 不可播放）、concept=概念版VIP
      require_vip_type: exists && !obtainable && neesuvip ? QUALITY_VIP_TYPE[quality] || 'concept' : '',
      msg: relateItem?._msg ?? '',
    };
  });

  const freeQualities = list.filter((item) => item.obtainable).map((item) => item.quality);
  // 需要 VIP/付费且不可获取的音质（免费听拿到的标准音质虽然 privilege≠0，但已可获取，不列入）
  const vipQualities = list.filter((item) => item.exists && item.need_vip && !item.obtainable).map((item) => item.quality);
  const blockedQualities = list.filter((item) => item.exists && !item.obtainable && !item.need_vip).map((item) => item.quality);
  const missingQualities = list.filter((item) => !item.exists).map((item) => item.quality);
  // 需要超级VIP 的音质（概念版 VIP、tvip 不可播放）
  const diamonsuvipQualities = list.filter((item) => item.require_vip_type === 'suvip').map((item) => item.quality);
  const freeSong = list.length > 0 && list.every((item) => !item.need_vip);
  // 最佳可获取音质：先按上游 level（2=128 < 4=320 < 5=flac < 6=Hi-Res < 7=DSD），
  // level 为 0 的特殊音质（蝰蛇/多轨）按 QUALITY_ORDER 兜底比较
  const bestFree = list
    .filter((item) => item.obtainable)
    .sort((a, b) => (a.level || 0) - (b.level || 0) || QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality))
    .pop();

  return {
    hash,
    album_id: String(resource?.album_id ?? albumId ?? ''),
    album_audio_id: String(resource?.album_audio_id ?? albumAudioId ?? ''),
    name: resource?.name ?? '',
    singername: resource?.singername ?? '',
    albumname: resource?.albumname ?? '',
    free_song: freeSong,
    free_listen: list.some((item) => item.free_listen),
    qualities: list,
    free_qualities: freeQualities,
    vip_qualities: vipQualities,
    super_vip_qualities: diamonsuvipQualities,
    blocked_qualities: blockedQualities,
    missing_qualities: missingQualities,
    best_free_quality: bestFree ? bestFree.quality : '',
  };
};

module.exports = (params, useAxios) => {
  const hashList = String(params?.hash || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!hashList.length) {
    return Promise.reject({ status: 502, body: { status: 0, error_code: -1, error: '缺少歌曲 hash' } });
  }

  const albumIdList = String(params?.album_id || '').split(',');
  const albumAudioIdList = String(params?.album_audio_id || '').split(',');
  // 注意：resource 里不要带 album_audio_id —— 实测传了之后上游会省略 128 音质的 ogg 条目
  // （概念版播放的就是该 ogg 文件，弹窗里的标准音质大小也来自它），因此这里只用 hash + album_id
  const resource = hashList.map((hash, index) => ({
    type: 'audio',
    page_id: 0,
    hash,
    album_id: albumIdList[index] || 0,
  }));

  // 需要判断的音质：默认 = 客户端的标准/高品质/无损/Hi-Res + 需超级VIP 的蝰蛇三档
  // （蝰蛇音质不放进默认会用不显示，导致 super_vip_qualities 恒为空）；传 qualities=all 表示全部上游音质
  const qualitiesParam = String(params?.qualities || '')
    .trim()
    .toLowerCase();
  const qualities =
    qualitiesParam === 'all'
      ? [...UPSTREAM_QUALITIES]
      : (qualitiesParam || '128,320,flac,high,viper_tape,viper_clear,viper_atmos')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  const dataMap = {
    appid,
    area_code: 1,
    behavior: 'play',
    clientver,
    need_hash_offset: 1,
    relate: 1,
    support_verify: 1,
    resource,
    qualities: UPSTREAM_QUALITIES,
  };

  return new Promise((resolve, reject) => {
    useAxios({
      url: '/v2/get_res_privilege/lite',
      data: dataMap,
      method: 'post',
      encryptType: 'android',
      cookie: params?.cookie || {},
      headers: { 'x-router': 'media.store.kugou.com', 'Content-Type': 'application/json' },
    })
      .then((res) => {
        const isLite = process.env.platform === 'lite';
        const data = Array.isArray(res?.body?.data) ? res.body.data : [];
        // 上游按请求顺序返回，多曲时按 hash 匹配更稳妥
        res.body.quality_vip = hashList.map((hash, index) => {
          const item = data.find((x) => String(x?.hash || '').toLowerCase() === hash) || data[index] || {};
          return buildQualityVip(hash, resource[index].album_id, albumAudioIdList[index], item, qualities, isLite);
        });
        resolve(res);
      })
      .catch(reject);
  });
};
