# 酷狗歌曲弹幕与视频弹幕逆向记录

## 结论

酷狗概念版的“弹幕”不是一套独立于评论系统的新服务，而是播放器把特定评论池中的文本转换成横向飞行视图。歌曲弹幕、MV 视频弹幕和频道短视频弹幕分别使用不同
的资源代码，因此不能只替换资源 ID 后复用同一个 `code`。

| 场景                | 资源代码                           | 读取动作 `r`                    | 主定位参数                                       | 当前接入状态               |
| ------------------- | ---------------------------------- | ------------------------------- | ------------------------------------------------ | -------------------------- |
| 歌曲播放器弹幕      | `articulossong`                    | `comments/getCommentWithLike`   | `childrenid` 或 `extdata=歌曲 hash`              | 已接入                     |
| MV 播放器弹幕       | `db3664c219a6e350b00ab08d7f723a79` | `comments/getCommentWithLike`   | `childrenid=video_id` 或 `extdata=MV hash`       | 已接入                     |
| 频道/投稿短视频弹幕 | `youngchannelpost`                 | `commentsv2/getCommentWithLike` | `childrenid=global_collection_id + "_" + fileid` | 已确认协议，未并入 MV 路由 |

项目新增的读取路由是 `/song/barrage` 和 `/video/barrage`，发送路由是 `/song/barrage/send` 和 `/video/barrage/send`。这里的“视频”明确指现有
`/video/detail`、`/video/url` 所属的 MV 资源体系。

## 静态证据链

概念版 3.2.3 的 `com.kugou.android.video.subview.BulletsView` 在拉取 MV 弹幕时调用 `com.kugou.android.mv.comment.a.b`。后者将 `MV.P()` 作为 MV
hash、`MV.O()` 作为视频名，并拼出 `r=comments/getCommentWithLike`、资源代码 `db3664c219a6e350b00ab08d7f723a79`、`extdata`、`childrenname`、`p` 和
`pagesize`。响应列表被转换为 `MVComment`，播放器实际只取 `user_pic` 和 `content` 生成飞行文本。

MV 发送链路位于 `com.kugou.android.mv.comment.a.a`。它使用同一资源代码，但动作变为 `comments/addcomment`，并通过查询参数提交
`childrenid`、`childrenname`、`content`、可选 `pid`、登录凭证和设备字段。该请求在 APK 中是 GET，而不是 JSON POST。

歌曲和频道投稿使用通用评论协议。`com.kugou.android.app.player.comment.d` 的默认资源代码是 `articulossong`；`com.kugou.android.app.player.comment.d.d`
的顶层发布动作是 `commentsv3/add`。通用参数拼装和 body 签名位于 `com.kugou.android.app.common.comment.protocol.o` 与 `protocol.a`。

频道投稿视频的另一套 `BulletsView` 位于 `com.kugou.android.app.home.channel.video.subview.BulletsView`。它明确构造 `new i("youngchannelpost")`，以
`ContributionEntity.u()` 合成的 `<global_collection_id>_<fileid>` 作为 `childrenid` 拉取 `commentsv2/getCommentWithLike`。这不是 MV hash/video_id 体系
，故本次没有暗中混入 `/video/barrage`。

## 请求协议

四个接口都落到评论服务的 `/index.php`。项目通过 `https://gateway.kugou.com/index.php` 发送，并设置 `x-router: m.comment.service.kugou.com`，避免依赖旧
源码中的明文 HTTP 地址。旧评论接口使用的 `key` 与网关 Android `signature` 是两种不同机制，因此实现中关闭了默认 `signature` 注入。

概念版的 `appid` 是 `3116`，appkey 是 `LnT6xpN3khm36zse0QzvmgTZ3waWdRSA`。MV 读取源码中的 key 公式如下：

```text
key = MD5(appid + appkey + clientver + clienttime)
```

歌曲顶层发送走 JSON POST，body 会参与 key：

```text
body = JSON.stringify({ data: { content, album_audio_id?, images: [] } })
key  = MD5(appid + appkey + clientver + clienttime + mid + body)
```

歌曲读取支持两种定位方式。已知评论资源 ID 时传 `childrenid`；只知道歌曲 hash 时传 `extdata=hash`，服务会在响应的 `childrenid` 中返回解析出的
`special_child_id`。`mixsongid` 不是定位旧弹幕池的充分条件，可以作为附加信息，但只传它会返回“未传入 hash”。

MV 读取同样支持两种定位方式。传 `childrenid=video_id` 可直接查询；传 `extdata=MV hash` 时，服务会映射到 `video_id`。实测 `mkv_sd_hash` 和 H.264 清晰度
hash 均能映射到同一视频。

## 歌曲弹幕与普通歌曲评论的区别

项目原有 `/comment/music` 使用 `/mcomment/v1/cmtlist` 和资源代码 `fc4be23b4e972707f36b8a828a93ba8a`。歌曲弹幕使用旧池 `articulossong`。以同一首歌测试
时，两个池的 `count`、评论 ID 和列表内容均不同，所以新增路由没有简单代理到 `/comment/music`。

APK 的通用读取类仍包含 `commentsv2/getCommentWithLike`。但在 2026-09-09 的当前服务上，`articulossong + commentsv2/getCommentWithLike` 会返回数量而
`list` 为空；改用 `comments/getCommentWithLike` 才能取得实际弹幕列表。这说明客户端源码与在线服务存在版本漂移，当前实现选择了已在线验证的动作。

## 响应结构

读取响应的核心字段包括 `status`、`err_code`、`count`、`childrenid`、`current_page`、`list` 和 `weightList`。每个列表项通常含
`id`、`content`、`user_id`、`user_name`、`user_pic`、`like`、`special_child_id`、`special_child_name`、`code` 和资源 hash。歌曲旧池还会返回
`loadoffset`，但播放器源码是按列表顺序循环投放，并未发现按播放时间轴调度该字段的逻辑，因此不把它定义为严格的弹幕时间戳。

## 在线验证结果

歌曲样本使用 hash `043C4DA61870CD55C1240F0FA6744C94`，服务解析得到 `childrenid=100285259`，按 hash 和按 ID 查询均返回 `code=articulossong` 的非空列表
。

MV 样本使用 `video_id=17633253` 和 hash `1AD9695C25DFC565F4A06963B344F25B`，两种查询均返回同一 `childrenid=17633253`，列表项资源代码为
`db3664c219a6e350b00ab08d7f723a79`。

发送请求构造器已通过离线断言验证，包括资源解析、方法、参数、JSON body 和 MD5 key。为避免在用户账号下产生不可撤销的公开内容，本次没有执行真实发布；发送
端的最终账号风控、手机号验证和审核状态仍需在明确授权发布测试内容后验证。

## 项目文件

协议参数集中在 `module/_comment.js`。四个公开模块分别是 `module/song_barrage.js`、`module/song_barrage_send.js`、`module/video_barrage.js` 和
`module/video_barrage_send.js`。HTTP 用法写入 `docs/README.md`，程序化 API 类型写入 `interface.d.ts`。
