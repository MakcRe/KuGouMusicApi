# KuGouMusic API

酷狗音乐 NodeJS 版 API

[![](https://img.shields.io/badge/Author-MakcRe-blueviolet?style=for-the-badge '作者')](https://github.com/MakcRe)
![](https://img.shields.io/badge/dynamic/json?label=GitHub%20Followers&style=for-the-badge&query=%24.data.totalSubs&url=https%3A%2F%2Fapi.spencerwoo.com%2Fsubstats%2F%3Fsource%3Dgithub%26queryKey%3DMakcRe&labelColor=282c34&color=181717&logo=github&longCache=true '关注数量')
![](https://img.shields.io/github/stars/MakcRe/KuGouMusicApi.svg?style=for-the-badge&label=Star 'Star数量')
![](https://img.shields.io/github/forks/MakcRe/KuGouMusicApi.svg?style=for-the-badge&label=Fork 'Fork数量')
![](https://img.shields.io/github/issues/MakcRe/KuGouMusicApi.svg?style=for-the-badge&label=Issues 'Issues数量')
![](https://img.shields.io/github/contributors/MakcRe/KuGouMusicApi?style=for-the-badge '贡献者')
![](https://img.shields.io/github/repo-size/MakcRe/KuGouMusicApi?style=for-the-badge&label=files&color=cf8ef4&labelColor=373e4dl '文件大小')
![](https://img.shields.io/github/languages/code-size/MakcRe/KuGouMusicApi?color=blueviolet&style=for-the-badge '代码大小')

[//]: # '<br>'

![](https://img.shields.io/github/package-json/v/MakcRe/KuGouMusicApi?longCache=true&style=for-the-badge)
![](https://img.shields.io/badge/Node-12+-green.svg?longCache=true&style=for-the-badge)
![](https://img.shields.io/badge/License-mit-blue.svg?longCache=true&style=for-the-badge)

## 灵感来自

[Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)

## 环境要求

需要 NodeJS 12+ 环境

## 工作原理

跨站请求伪造 (CSRF), 伪造请求头 , 调用官方 API

## 免责声明

> 1. 本项目仅供学习使用，请尊重版权，请勿利用此项目从事商业行为及非法用途!
> 2. 使用本项目的过程中可能会产生版权数据。对于这些版权数据，本项目不拥有它们的所有权。为了避免侵权，使用者务必在 24 小时内清除使用本项目的过程中所产
>    生的版权数据。
> 3. 由于使用本项目产生的包括由于本协议或由于使用或无法使用本项目而引起的任何性质的任何直接、间接、特殊、偶然或结果性损害（包括但不限于因商誉损失、停
>    工、计算机故障或故障引起的损害赔偿，或任何及所有其他商业损害或损失）由使用者负责。
> 4. **禁止在违反当地法律法规的情况下使用本项目。** 对于使用者在明知或不知当地法律法规不允许的情况下使用本项目所造成的任何违法违规行为由使用者承担，本
>    项目不承担由此造成的任何直接、间接、特殊、偶然或结果性责任。
> 5. 音乐平台不易，请尊重版权，支持正版。
> 6. 本项目仅用于对技术可行性的探索及研究，不接受任何商业（包括但不限于广告等）合作及捐赠。
> 7. 如果官方音乐平台觉得本项目不妥，可联系本项目更改或移除。

### 安装

```shell
$ git clone git@github.com:MakcRe/KuGouMusicApi.git
$ cd KuGouMusicApi
$ npm install
```

### 使用接口为概念版

```
$ 复制 .env.example 为 .env，并且把里面的 `platform=''` 改为 `platform=lite`
$ 注意不同版本的平台的 token 是不通用的。
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
6. 若需要部署版本为概念版（不需要该步骤可以跳过），在 `Environment Variables` 添加 `key` 为 `platform`，`Value (Will Be Encrypted)` 为 `lite` 然后点击
   `Add`
7. `PROJECT NAME`自己填,`FRAMEWORK PRESET` 选 `Other` 然后直接点 `Deploy` 接着等部署完成即可

## 功能特性

1. 登录
2. 刷新登录
3. 发送验证码
4. dfid 获取
5. 获取用户额外信息
6. 获取用户 vip 信息
7. 获取用户歌单
8. 获取用户关注歌手
9. 获取用户听歌历史排行
10. 获取用户最近听歌历史
11. 收藏歌单/新建歌单
12. 取消收藏歌单/删除歌单
13. 对歌单添加歌曲
14. 对歌单删除歌曲
15. 新碟上架
16. 专辑信息
17. 专辑详情
18. 专辑音乐列表
19. 获取音乐 URL
20. 获取歌曲高潮部分
21. 搜索
22. 默认搜索关键词
23. 综合搜索
24. 热搜列表
25. 歌词搜索
26. 获取歌词
27. 歌单分类
28. 歌单
29. 主题歌单
30. 音效歌单
31. 获取歌单详情
32. 获取歌单所有歌曲
33. 获取歌单所有歌曲（新版）
34. 相似歌单
35. 获取主题歌单所有歌曲
36. 获取主题音乐
37. 获取主题音乐详情
38. 歌曲推荐
39. 获取歌手和专辑图片
40. 获取歌手图片
41. 获取音乐相关信息
42. 获取音乐详情
43. 获取音乐专辑/歌手信息
44. 私人 FM(对应手机和 pc 端的猜你喜欢)
45. banner
46. 乐库 banner
47. 乐库电台
48. 乐库
49. 电台 - 推荐
50. 电台
51. 电台 - 图片
52. 电台 - 音乐列表
53. 编辑精选
54. 编辑精选数据
55. 编辑精选歌单
56. 编辑精选专区
57. 编辑精选专区详情
58. 领取 VIP（需要登陆，该接口为测试接口）
59. 获取歌手列表
60. 获取歌手详情
61. 获取歌手专辑
62. 获取歌手单曲
63. 获取歌手 MV
64. 获取视频 url
65. 获取歌曲 MV
66. 获取视频相关信息
67. 获取视频详情
68. 新歌速递
69. 场景音乐列表
70. 场景音乐详情
71. 获取场景音乐讨论区
72. 获取场景音乐模块 Tag
73. 获取场景音乐歌单列表
74. 获取场景音乐视频列表
75. 获取场景音乐音乐列表
76. 每日推荐
77. 历史推荐
78. 风格推荐
79. 排行列表
80. 排行榜推荐列表
81. 排行榜往期列表
82. 排行榜信息
83. 排行榜歌曲列表
84. 歌曲评论
85. 歌曲评论-根据分类返回
86. 歌曲评论-根据热词返回
87. 楼层评论
88. 歌单评论
89. 专辑评论
90. 歌曲曲谱
91. 曲谱详情
92. 推荐曲谱
93. 曲谱合集
94. 曲谱合集详情
95. 提交听歌历史
96. 获取服务器时间
97. 刷刷
98. AI 推荐
99. 频道 - 获取用户所有频道
100. 频道 - 详情
101. 频道 - 频道安利
102. 频道 - 相似频道
103. 频道 - 订阅
104. 频道 - 音乐故事
105. 频道 - 音乐故事详情
106. 动态 - 最常访问
107. 获取用户公开的音乐
108. 听书 - 每日推荐
109. 听书 - 排行榜推荐
110. 听书 - VIP 推荐
111. 听书 - 每周推荐
112. 听书 - 专辑详情
113. 听书 - 专辑音乐列表

## License

[The MIT License (MIT)](https://github.com/MakcRe/KuGouMusicApi/blob/main/LICENSE)
