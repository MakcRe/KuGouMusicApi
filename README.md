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
3. 点击 `Import Git Repository` 并选择你 fork 的此项目并点击 `import`
4. 点击 `PERSONAL ACCOUNT` 的 `select`
5. 直接点 `Continue`
6. `PROJECT NAME`自己填,`FRAMEWORK PRESET` 选 `Other` 然后直接点 `Deploy` 接着等部署完成即可

## 功能特性

1. 登录
2. 刷新登录
3. 发送验证码
4. dfid 获取
5. 获取用户歌单
6. 获取用户最近听歌历史
7. 收藏歌单
8. 取消收藏歌单
9. 对歌单添加歌曲
10. 对歌单删除歌曲
11. 新碟上架
12. 专辑信息
13. 专辑详情
14. 专辑音乐列表
15. 获取音乐 URL
16. 获取歌曲高潮部分
17. 搜索
18. 综合搜索
19. 歌词搜索
20. 获取歌词
21. 歌单分类
22. 歌单
23. 主题歌单
24. 音效歌单
25. 获取歌单详情
26. 获取歌单所有歌曲
27. 获取歌单所有歌曲（新版）
28. 获取主题歌单所有歌曲
29. 获取主题音乐
30. 获取主题音乐详情
31. 歌曲推荐
32. 获取歌手和专辑图片
33. 获取歌手图片
34. 获取音乐相关信息
35. 获取音乐详情
36. 获取音乐专辑/歌手信息
37. 私人 FM(对应手机和 pc 端的猜你喜欢)
38. banner
39. 乐库 banner
40. 乐库电台
41. 乐库
42. 推荐频道
43. 频道
44. 频道图片
45. 频道歌曲
46. 编辑精选
47. 编辑精选数据
48. 编辑精选歌单
49. 编辑精选专区
50. 编辑精选专区详情
51. 领取 VIP（需要登陆，该接口为测试接口）
52. 获取歌手详情
53. 获取歌手专辑
54. 获取歌手单曲
55. 获取歌手 MV
56. 获取视频 url
57. 获取视频相关信息
58. 获取视频详情
59. 新歌速递
60. 场景音乐列表
61. 场景音乐详情
62. 获取场景音乐讨论区
63. 获取场景音乐模块 Tag
64. 获取场景音乐歌单列表
65. 获取场景音乐视频列表
66. 获取场景音乐音乐列表
67. 每日推荐
68. 历史推荐
69. 风格推荐
70. 排行列表
71. 排行榜推荐列表
72. 排行榜往期列表
73. 排行榜信息
74. 排行榜歌曲列表
