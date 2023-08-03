KuGouMusic API

酷狗音乐 NodeJS 版 API

## 灵感来自

[Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)

## 工作原理

跨站请求伪造 (CSRF), 伪造请求头 , 调用官方 API

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

windows 下使用 PowerShell 等终端执行以下命令 :

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

windows 下使用 PowerShell 等终端执行以下命令 :

```shell
$ $Env:HOST=127.0.0.1; npm run dev
```

## Vercel 部署

### 操作方法

1. fork 此项目
2. 在 Vercel 官网点击 `New Project`
3. 点击 `Import Git Repository` 并选择你 fork 的此项目并点击`import`
4. 点击 `PERSONAL ACCOUNT` 的 `select`
5. 直接点`Continue`
6. `PROJECT NAME`自己填,`FRAMEWORK PRESET` 选 `Other` 然后直接点 `Deploy` 接着等部署完成即可

## 功能特性

1. 登录
2. 发送验证码
3. dfid 获取
4. 每日推荐歌曲
5. 新碟上架
6. 专辑音乐列表
7. 专辑详情
8. 获取音乐 URL
9. 搜索
10. 综合搜索
11. 歌词搜索
12. 获取歌词
13. 热门好歌精选
14. 每日主题音乐
15. 获取每日主题音乐详情
16. 歌单
17. 歌单分类
18. 主题歌单
19. 音效歌单
20. 歌单详情
21. 主题歌单详情
22. 获取歌单所有音乐
23. 获取歌手图片
24. 新歌速递
25. 乐库
26. 乐库 Banner
27. 乐库频道
28. 今日推荐
29. 获取今日推荐音乐/专辑/歌手/视频
30. 获取今日推荐详情
31. 获取今日推荐信息
