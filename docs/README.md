# KuGouMusic API

酷狗音乐 NodeJS 版 API

## 工作原理

跨站请求伪造 (CSRF), 伪造请求头 , 调用官方 API

## 功能特性

1. 登录
2. 发送验证码
3. dfid 获取
4. 获取用户歌单
5. 新碟上架
6. 专辑信息
7. 专辑详情
8. 专辑音乐列表
9. 获取音乐 URL
10. 搜索
11. 综合搜索
12. 歌词搜索
13. 获取歌词
14. 歌单分类
15. 歌单
16. 主题歌单
17. 音效歌单
18. 获取歌单详情
19. 获取歌单所有歌曲
20. 获取主题歌单所有歌曲
21. 获取主题音乐
22. 获取主题音乐详情
23. 歌曲推荐
24. 获取歌手和专辑图片
25. 获取歌手图片
26. 获取音乐相关信息
27. 获取音乐详情
28. 私人 FM(对应手机和 pc 端的猜你喜欢)
29. banner

### 安装

```shell
$ git clone git@github.com:MakcRe/KuGouMusicApi.git
$ cd KuGouMusicApi
$ npm install
```

### 运行

```shell
$ npm run dev
```

服务器启动默认端口为 3000, 若不想使用 3000 端口 , 可使用以下命令 : Mac/Linux

```shell
$ PORT=4000 npm run dev
```

windows 下使用 git-bash 或者 cmder 等终端执行以下命令 :

```shell
$ set PORT=4000 && npm run dev
```

windows 下使用 PowerShell 终端执行一下命令 :

```shell
$ $Env:PORT=4000; npm run dev
```

服务器启动默认 host 为 localhost,如果需要更改, 可使用以下命令 : Mac/Linux

```shell
$ HOST=127.0.0.1 npm run dev
```

windows 下使用 git-bash 或者 cmder 等终端执行以下命令 :

```shell
$ set HOST=127.0.0.1 && npm run dev
```

## Vercel 部署

### 操作方法

1. fork 此项目
2. 在 Vercel 官网点击 `New Project`
3. 点击 `Import Git Repository` 并选择你 fork 的此项目并点击`import`
4. 点击 `PERSONAL ACCOUNT` 的 `select`
5. 直接点`Continue`
6. `PROJECT NAME`自己填,`FRAMEWORK PRESET` 选 `Other` 然后直接点 `Deploy` 接着等部署完成即可

## 接口文档

### 调用前须知

!> 本项目不提供线上 demo，请不要轻易信任使用他人提供的公开服务，以免发生安全问题,泄露自己的账号和密码

!> 为使用方便,降低门槛, 文档示例接口直接使用了 GET 请求,本项目同时支持 GET/POST 请按实际需求使用 (POST 请求 url 必须添加时间戳,使每次请求 url 不一样,
不然请求会被缓存)

!> 由于接口做了缓存处理 ( 缓存 2 分钟,), 相同的 url 会在两分钟内只向网易服务器发一次请求 , 如果遇到不需要缓 存结果的接口 , 可在请求 url 后面加一个时间
戳参数使 url 不同 , 例子 : /personal/fm?timestamp=1691256061923 (请按自己需求改造缓存中间件(app.js)，源码不复杂) 该缓存机制来源
于[Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)

!> 不要频繁调登录接口,不然可能会被风控,登录状态还存在就不要重复调登录接口

!> 如果是跨域请求 , 请在所有请求带上 xhrFields: { withCredentials: true } (axios 为 withCredentials: true, Fetch API 为 fetch(url, { credentials:
'include' })), 或直接手动传入 cookie (参见 登录), 否则 可能会因为没带上 cookie 导致 301, 具体例子可看 public/test.html, 访问
http://localhost:3000/test.html(默认端口的话) 例子使用 jQuery 和 axios

!> 本项目仅供学习使用,请尊重版权，请勿利用此项目从事商业行为或进行破坏版权行为

!> 文档可能会有缓存 , 如果文档版本和 github 上的版本不一致,请清除缓存再查看

### 登录

说明：登录有五个接口使用`encodeURIComponent`对密码编码或者使用`POST`请求，避免某些特殊字符无法解析,如#(#在 url 中会被识别为 hash,而不是 query)

不要频繁调登录接口,不然可能会被风控,登录状态还存在就不要重复调登录接口

#### 1.手机登录

**必选参数：**

`mobile`: 手机号码

`code`: 验证码，使用 [`/captcha/sent`](#发送验证码)接口传入手机号获取验证码,调用此接口传入验证码,可使用验证码登录

**接口地址：** `/login/cellphone`

**调用例子：** `/login/cellphone?mobile=xxx&code=xxx`

#### 2. 用户名登录(该登录可能需要验证，不推荐使用)

**必选参数：**

`username`: 用户名

`password`: 密码

**接口地址：** `/login`

**调用例子：** `/login?username=xxx&password=yyy`

#### 3. 开放接口登录(目前仅支持微信登录)

说明: 该接口为第三方平台登录，目前仅支持微信登录

**必选参数：**

`code`: 由微信扫码成功后生成

**接口地址：** `/login/openplat`

**调用例子：** `/login/openplat?code=xxx`

#### 4. 二维码登录

说明: 二维码登录涉及到 3 个接口,调用务必带上时间戳,防止缓存

##### 1.二维码 key 生成接口

说明: 调用此接口可生成一个 key

**接口地址：** `/login/qr/key`

##### 2.二维码生成接口

说明: 调用此接口传入上一个接口生成的 key 可生成二维码图片的 base64 和二维码信息,可使用 base64 展示图片,或者使用二维码信息内容自行使用第三方二维码生成
库渲染二维码

**必选参数：**

`key`: ,由第一个接口生成

**可选参数：**

`base64`: 传入后会额外返回二维码图片 base64 编码

**接口地址：** `/login/qr/create`

**调用例子：** `/login/qr/create?key=xxx`

##### 2.二维码检测扫码状态接口

说明: 轮询此接口可获取二维码扫码状态,0 为二维码过期，1 为等待扫码，2 为待确认，4 为授权登录成功（4 状态码下会返回 token）

**必选参数：**

`key`: ,由第一个接口生成

**接口地址：** `/login/qr/check`

**调用例子：** `/login/qr/check?key=xxx`

#### 5. 微信登录

说明：微信登录涉及到 2 个接口,调用务必带上时间戳,防止缓存

##### 1. 二维码生成接口

说明：调用此接口可生成微信的 uuid, 包括二维码 Bae64 和 二维码扫描链接, 注: 该接口请求的接口过多, 会出现返回较慢的情况

**接口地址：** `/login/wx/create`

**调用例子：** `/login/wx/create`

##### 2.二维码检测扫码状态接口

说明：轮询此接口可获取二维码扫码状态, 408 为等待扫描，404 为已经扫描，403 为拒绝登录，405 为登录成功，402 为已过期(405 状态下登陆完成口会返回 wx_code,
用于开放登陆 [`/login/openplat`](#_3-开放接口登录目前仅支持微信登录)), 注：该接口有一定延时，不可访问是可以直接到
https://long.open.weixin.qq.com/connect/l/qrconnect?f=json&uuid=xxx 该接口直接请求

**接口地址：** `/login/wx/check`

**调用例子：** `/login/wx/check`

### 刷新登录

说明 : 调用此接口，可刷新登录状态，可以延长 `token` 过期时间

**可选参数：**

`token`: 登录后获取的 token

`userid`: 用户 id

**接口地址：** `/login/token`

**调用例子：** `/login/token` `/login/token?token=xxx&userid=xxx`

### 发送验证码

说明: 调用此接口 ,传入手机号码, 可发送验证码

**必选参数：**

`mobile`: 手机号码

**接口地址：** `/captcha/sent`

**调用例子：** `/captcha/sent?mobile=xxx`

### dfid 获取

**接口地址：** `/register/dev`

**调用例子：** `/register/dev`

### 获取用户歌单

说明：登录后调用此接口，可以获取用户的所有创建以及收藏的歌单

**可选参数：**

`page`：页数

`pagesize `: 每页页数, 默认为 30

**接口地址：** `/user/playlist`

**调用例子：** `/user/playlist`

### 新碟上架

说明: 调用此接口 , 可获取新碟上架列表, 如需要专辑详细信息需要调用[`album/detail`](#专辑详情), 如需要获取专辑音乐列表需调
用[`album/songs`](#专辑音乐列表)

**可选参数：**

`type `: 1：华语；2：欧美；3：日本；4：韩国；推荐为空，默认为空

`page `: 页数

`pagesize `: 每页页数, 默认为 30

**接口地址：** `/top/album`

**调用例子：** `/top/album`

### 专辑信息

说明: 调用此接口 ,传入专辑 id 可获取专辑相关信息

**必选参数：**

`album_id`: 专辑 id,可以传多个，以逗号分割

`fields`: 需要返回的信息，可以传多个，以逗号分割

**接口地址：** `/album`

**调用例子：** `/album?album_id=xxx`, `/album?album_id=xxx,xxx`, `/album?album_id=xxx&fields=language,authors`

### 专辑详情

说明: 调用此接口 ,传入专辑 id 可获取专辑详情

**必选参数：**

`id`: 专辑 id

**接口地址：** `/album/detail`

**调用例子：** `/album/detail?id=10729818`

### 专辑音乐列表

说明: 调用此接口 ,传入专辑 id 可获取专辑音乐列表

**必选参数：**

`id`: 专辑 id

**可选参数：**

`page `: 页数

`pagesize `: 每页页数, 默认为 30

**接口地址：** `/album/songs`

**调用例子：** `/album/songs?id=10729818`

### 获取音乐 URL

说明: 调用此接口, 传入的音乐 hash, 可以获取对应的音乐的 url, 未登录状态或者非会员可能会返回为空，需要高品质的音乐 url 这需要传入对应的 hash

**必选参数：**

`hash`: 音乐 hash

**可选参数：**

`album_id`: 专辑 id

`free_part`: 是否返回试听部分（仅部分歌曲）

`album_audio_id`：专辑音频 id

`quality`：获取不同音质的 url

**quality 支持的参数**

`piano`：对应手机端魔法音乐 钢琴，仅部分音乐支持

`acappella`：对应手机端魔法音乐 人声 伴奏，仅部分音乐支持，该模式下返回的音频后缀为 mkv 格式，该文加存在 人声 和 伴奏 两个音轨

`subwoofer`：对应手机端魔法音乐 乐器，仅部分音乐支持

`ancient`：对应手机端魔法音乐 尤克里里，仅部分音乐支持

`dj`：对应手机端魔法音乐 DJ，仅部分音乐支持

`128`：返回 128 码率 mp3 格式

`320`：返回 320 码率 mp3 格式

`flac`：返回 flac 格式音频

`high`：返回无损格式音频

`viper_atmos`：蝰蛇全景声，仅部分音乐支持

**接口地址：** `/song/url`

**调用例子：** `/song/url?hash=xxx`

### 搜索

说明: 调用此接口 , 传入搜索关键词可以搜索该音乐 / mv / 歌单 / 歌词 / 专辑 / 歌手

**必选参数：**

`keyword`: 关键词

**可选参数：**

`page `: 页数

`pagesize `: 每页页数, 默认为 30

`type`: 搜索类型；默认为单曲，special：歌单，lyric：歌词，song：单曲，album：专辑，author：歌手，mv：mv

**接口地址：** `/search`

**调用例子：** `/search?keywords=海阔天空`

### 综合搜索

说明: 调用此接口, 传入搜索关键词可以获得综合搜索，搜索结果同时包含单曲 , 歌手 , 歌单等信息

**必选参数：**

`keyword`: 关键词

**可选参数：**

`page `: 页数

`pagesize `: 每页页数, 默认为 30

**接口地址：** `/search/complex`

**调用例子：** `/search/complex?keywords=海阔天空`

### 歌词搜索

说明: 调用此接口, 可以搜索歌词，该接口需配合 [`/lyric`](#获取歌词) 使用。

**必选参数：**

`keyword`: 关键词，与 hash 二选一

`hash`: 歌曲 hash，与 keyword 二选一

**可选参数：**

`album_audio_id`: 专辑音乐 id

**接口地址：** `/search/lyric`

**调用例子：** `/search/lyric?keywords=xxx` `/search/lyric?keywords=xxx&hash=xxx`

### 获取歌词

说明 : 调用此接口，可以获取歌词，调用该接口前则需要调用[`/search/lyric`](#歌词搜索) 获取完整参数

**必选参数：**

`id`: 歌词 id, 可以从 [`/search/lyric`](#歌词搜搜) 接口中获取

`accesskey`: 歌词 accesskey, 可以从 [`/search/lyric`](#歌词搜搜) 接口中获取

**可选参数：**

`fmt`: 歌词类型，lrc 为普通歌词，krc 为逐字歌词

`decode`: 是否解码，传入该参数这返回解码后的歌词

**接口地址：** `/lyric`

**调用例子：** `/lyric?id=xxx&accesskey=xxx` `/lyric?id=xxx&accesskey=xxx&fmt=lrc` `/lyric?id=xxx&accesskey=xxx&decode=true`

### 歌单分类

说明 : 调用此接口,可获取歌单分类,包含 category 信息

**接口地址：** `/playlist/tags`

**调用例子：** `/playlist/tags`

### 歌单

说明 : 调用此接口 , 可获取歌单

**必选参数：**

`category_id`: tag，0：推荐，11292：HI-RES，其他可以从 [`/playlist/tags`](#歌单分类) 接口中获取（接口下的 `tag_id` 为 `category_id`的值）

**可选参数：**

`withsong`: 是否返回歌曲列表（不全），0：不返回，1：返回

`withtag`: 是否返回歌单分类，0：不返回，1：返回

**接口地址：** `/top/playlist`

**调用例子：** `/top/playlist?category_id=0`

### 主题歌单

说明 : 调用此接口 , 可获取主题歌单, 通过 [`/theme/playlist/track`](#获取主题歌单所有歌曲) 可以获取主题个单下的歌曲

**接口地址：** `/theme/playlist`

**调用例子：** `/theme/playlist`

### 音效歌单

说明 : 调用此接口 , 可获取音效歌单

**可选参数：**

`page `: 页数

`pagesize `: 每页页数, 默认为 30

**接口地址：** `/playlist/effect`

**调用例子：** `/playlist/effect`

### 获取歌单详情

说明: 调用此接口 , 可获取歌单详细信息

**必选参数：**

`ids`: 歌单中的 `global_collection_id`，可以传多个，用逗号分隔

**接口地址：** `/playlist/detail`

**调用例子：** `/playlist/detail?ids=collection_3_1863870844_4_0` `/playlist/detail?ids=collection_3_1863870844_4_0,collection_3_2093906551_8_0`

### 获取歌单所有歌曲

说明 : 调用此接口，传入对应的歌单 global_collection_id，即可获得对应的所有歌曲

**必选参数：**

`id`: 歌单中的 `global_collection_id`

**可选参数：**

`page `: 页数

`pagesize `: 每页页数, 默认为 30

**接口地址：** `/playlist/track/all`

**调用例子：** `/playlist/track/all?ids=collection_3_1863870844_4_0`

### 获取主题歌单所有歌曲

**必选参数：**

`theme_id`: 主题歌单 id

**接口地址：** `/theme/playlist/track`

**调用例子：** `/theme/playlist/track?theme_id=18`

### 获取主题音乐

说明 : 调用此接口，可以获取主题音乐，调用 [`/theme/music/detail`](#) 可以获取主题音乐详情

**接口地址：** `/theme/music`

**调用例子：** `/theme/music`

### 获取主题音乐详情

说明 : 调用此接口，传入对应的主题 id 可以获取主题音乐详情.

**必选参数：**

`id`: 主题音乐 id

**接口地址：** `/theme/music/detail`

**调用例子：** `/theme/music/detail?id=1002`

### 歌曲推荐

说明 : 调用此接口，可以获取歌曲推荐.

**必选参数：**

`card_id`: 1：对应安卓 精选好歌随心听 || 私人专属好歌，2：对应安卓 经典怀旧金曲，3：对应安卓 热门好歌精选，4：对应安卓 小众宝藏佳作，5：未知，6：对应
vip 专属推荐

**接口地址：** `/top/card`

**调用例子：** `/top/card?card_id=1`

### 获取歌手和专辑图片

说明 : 调用此接口，可以获取歌手和专辑图片.

**必选参数：**

`hash`: 歌曲 hash, 可以传多个，每个以逗号分开

**可选参数：**

`album_id`: 专辑 id, 可以传多个，每个以逗号分开

`album_audio_id`: 专辑音乐 id, 可以传多个，每个以逗号分开

`count`: 最多返回多少张图片，默认为 5

**接口地址：** `/images`

**调用例子：** `/images?hash=B04ED0F01ABBB62B9D22EC4616ED8AFE`
`/image?hash=B04ED0F01ABBB62B9D22EC4616ED8AFE,55603312694BF99AD6000C2D0D72D368&album_id=,75013431`

### 获取歌手图片

说明 : 调用此接口，可以获取歌手图片.

**必选参数：**

`hash`: 歌曲 hash, 可以传多个，每个以逗号分开

**可选参数：**

`audio_id`: 音乐 id, 可以传多个，每个以逗号分开

`album_audio_id`: 专辑音乐 id, 可以传多个，每个以逗号分开

`filename`: 音乐文件名称, 可以传多个，每个以逗号分开

`count`: 最多返回多少张图片，默认为 5

**接口地址：** `/images/audio`

**调用例子：** `/images/audio?hash=B04ED0F01ABBB62B9D22EC4616ED8AFE`
`/image/audio?hash=B04ED0F01ABBB62B9D22EC4616ED8AFE,55603312694BF99AD6000C2D0D72D368`

### 获取音乐相关信息

说明：调用此接口，可以获取音乐相关信息

**必选参数：**

`hash`: 歌曲 hash, 可以传多个，每个以逗号分开

**接口地址：** `/audio`

**调用例子：** `/audio?hash=B04ED0F01ABBB62B9D22EC4616ED8AFE` `/audio?hash=B04ED0F01ABBB62B9D22EC4616ED8AFE,55603312694BF99AD6000C2D0D72D368`

### 获取音乐详情

说明：调用此接口，可以获取音乐详情

**必选参数：**

`hash`: 歌曲 hash, 可以传多个，每个以逗号分开

**接口地址：** `/privilege/lite`

**调用例子：** `/privilege/lite?hash=B04ED0F01ABBB62B9D22EC4616ED8AFE`
`/privilege/lite?hash=B04ED0F01ABBB62B9D22EC4616ED8AFE,55603312694BF99AD6000C2D0D72D368`

### 私人 FM(对应手机和 pc 端的猜你喜欢)

说明 : 私人 FM

**可选参数：**

`hash`: 音乐 hash

`playtime`: 播放时间

`mode`: 获取模式，默认为 normal, normal：发现，small： 小众，peak：30s

`action`: 默认为 play, garbage: 为不喜欢

`song_pool_id`： 手机版的 AI，0：Alpha 根据口味推荐相似歌曲, 1：Beta 根据风格推荐相似歌曲, 2：Gamma

`is_overplay`: 是否已播放完成

**接口地址：** `/personal/fm`

**调用例子：** `/personal/fm`

### banner

说明 : 调用此接口 , 可获取 banner( 轮播图 ) 数据

**接口地址：** `/pc/diantai`

**调用例子：** `/pc/diantai`

### 乐库 banner

说明 : 调用此接口 , 可获取 乐库 banner( 轮播图 ) 数据

**接口地址：** `/yueku/banner`

**调用例子：** `/yueku/banner`

### 乐库电台

说明 : 调用此接口 , 可获取乐库电台数据

**接口地址：** `/yueku/fm`

**调用例子：** `/yueku/fm`

### 乐库

说明 : 调用此接口 , 可获取手机端乐库数据

**接口地址：** `/yueku`

**调用例子：** `/yueku`

### 推荐频道

说明 : 调用此接口 , 可获取推荐频道数据

**接口地址：** `/fm/recommend`

**调用例子：** `/fm/recommend`

### 频道

说明 : 调用此接口 , 可获取所有频道数据

**接口地址：** `/fm/class`

**调用例子：** `/fm/class`

### 频道图片

说明 : 调用此接口 , 可获取对应频道的图片

**必选参数：**

`fmid`: fmid，可以传多个，以逗号分割

**接口地址：** `/fm/image`

**调用例子：** `/fm/image?fmid=693` `/fm/image?fmid=693,37`

### 频道歌曲

说明 : 调用此接口 , 可获取对应频道的音乐列表

**必选参数：**

`fmid`: fmid，可以传多个，以逗号分割

**可选参数：**

`fmtype`: fmtype, 可以传多个，以逗号分割

`fmoffset`: 歌曲偏移，可以传多个，以逗号分割

`fmsize`: 歌曲列表大小，可以传多个，以逗号分割

**接口地址：** `/fm/songs`

**调用例子：** `/fm/image?fmid=693` `/fm/image?fmid=693,37&fmtype=2,2&fmoffset=,5&fmsize5,3`

### 编辑精选

说明 : 调用此接口 , 可获取编辑精选数据

**接口地址：** `/top/ip`

**调用例子：** `/top/ip`

### 编辑精选数据

说明 : 调用此接口 , 可获取编辑对应数据

**必选参数：**

`id`: ip id

**可选参数：**

`type`: 数据类型，audios: 音乐, albums: 专辑, videos: 视频, author_list: 歌手

`page`： 页码

`pagesize`: 每页页数, 默认为 30

**接口地址：** `/ip`

**调用例子：** `/ip?id=87473` `ip?id=87473&type=author_list`

### 领取 VIP（需要登陆，该接口为测试接口）

说明 : 调用此接口 , 每天可领取 1 天 VIP 时长，需要领取 8 次，每次增加 3 小时，该接口来自 KG 概念版，非会员用户需要自行测试是否可用(尽量别频繁调用)

**接口地址：** `/youth/vip`

**调用例子：** `/youth/vip`
