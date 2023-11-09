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
2. 刷新登录
3. 发送验证码
4. dfid 获取
5. 获取用户歌单
6. 新碟上架
7. 专辑信息
8. 专辑详情
9. 专辑音乐列表
10. 获取音乐 URL
11. 获取歌曲高潮部分
12. 搜索
13. 综合搜索
14. 歌词搜索
15. 获取歌词
16. 歌单分类
17. 歌单
18. 主题歌单
19. 音效歌单
20. 获取歌单详情
21. 获取歌单所有歌曲
22. 获取主题歌单所有歌曲
23. 获取主题音乐
24. 获取主题音乐详情
25. 歌曲推荐
26. 获取歌手和专辑图片
27. 获取歌手图片
28. 获取音乐相关信息
29. 获取音乐详情
30. 私人 FM(对应手机和 pc 端的猜你喜欢)
31. banner
32. 乐库 banner
33. 乐库电台
34. 乐库
35. 推荐频道
36. 频道
37. 频道图片
38. 频道歌曲
39. 编辑精选
40. 编辑精选数据
41. 领取 VIP（需要登陆，该接口为测试接口）
42. 获取歌手详情
43. 获取歌手专辑
44. 获取歌手单曲
45. 获取歌手 MV
46. 获取视频 url
47. 获取视频相关信息
