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

### 代理配置

如需通过 HTTP 代理请求酷狗接口，可在启动前设置 `KUGOU_API_PROXY` 环境变量，例如:

```shell
$ $Env:KUGOU_API_PROXY='http://127.0.0.1:7890'; npm run dev
```

也可以在启动命令后追加代理参数:

```shell
$ node app.js --proxy=http://127.0.0.1:7890
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
11. 获取继续播放信息（对应手机版首页显示继续播放入口）
12. 收藏歌单/新建歌单
13. 取消收藏歌单/删除歌单
14. 对歌单添加歌曲
15. 对歌单删除歌曲
16. 新碟上架
17. 专辑信息
18. 专辑详情
19. 专辑音乐列表
20. 专辑动态封面
21. 获取音乐 URL
22. 获取歌曲高潮部分
23. 搜索
24. 默认搜索关键词
25. 综合搜索
26. 热搜列表
27. 搜索建议
28. 歌词搜索
29. 获取歌词
30. 歌单分类
31. 歌单
32. 主题歌单
33. 音效歌单
34. 获取歌单详情
35. 获取歌单所有歌曲
36. 获取歌单所有歌曲（新版）
37. 相似歌单
38. 获取主题歌单所有歌曲
39. 获取主题音乐
40. 获取主题音乐详情
41. 歌曲推荐
42. 获取歌手和专辑图片
43. 获取歌手图片
44. 获取音乐相关信息
45. 获取更多音乐版本
46. 获取音乐伴奏信息
47. 获取音乐 k 歌数量
48. 获取音乐详情
49. 获取音乐专辑/歌手信息
50. 私人 FM(对应手机和 pc 端的猜你喜欢)
51. banner
52. 乐库 banner
53. 乐库电台
54. 乐库
55. 电台 - 推荐
56. 电台
57. 电台 - 图片
58. 电台 - 音乐列表
59. 编辑精选
60. 编辑精选数据
61. 编辑精选歌单
62. 编辑精选专区
63. 编辑精选专区详情
64. 领取 VIP（需要登陆，该接口为测试接口）
65. 获取歌手列表
66. 获取歌手详情
67. 获取歌手专辑
68. 获取歌手单曲
69. 获取歌手 MV
70. 关注歌手
71. 取消关注歌手
72. 获取关注歌手新歌
73. 获取视频 url
74. 获取歌曲 MV
75. 获取视频相关信息
76. 获取视频详情
77. 新歌速递
78. 场景音乐列表
79. 场景音乐详情
80. 获取场景音乐讨论区
81. 获取场景音乐模块 Tag
82. 获取场景音乐歌单列表
83. 获取场景音乐视频列表
84. 获取场景音乐音乐列表
85. 每日推荐
86. 历史推荐
87. 风格推荐
88. 排行列表
89. 排行榜推荐列表
90. 排行榜往期列表
91. 排行榜信息
92. 排行榜歌曲列表
93. 歌曲评论
94. 歌曲评论-根据分类返回
95. 歌曲评论-根据热词返回
96. 楼层评论
97. 歌单评论
98. 专辑评论
99. 歌曲曲谱
100. 曲谱详情
101. 推荐曲谱
102. 曲谱合集
103. 曲谱合集详情
104. 提交听歌历史
105. 获取服务器时间
106. 刷刷
107. AI 推荐
108. 频道 - 获取用户所有频道
109. 频道 - 详情
110. 频道 - 频道安利
111. 频道 - 相似频道
112. 频道 - 订阅
113. 频道 - 音乐故事
114. 频道 - 音乐故事详情
115. 动态 - 最常访问
116. 获取用户公开的音乐
117. 听书 - 每日推荐
118. 听书 - 排行榜推荐
119. 听书 - VIP 推荐
120. 听书 - 每周推荐
121. 听书 - 专辑详情
122. 听书 - 专辑音乐列表
123. 歌曲详情 - 歌曲成绩单
124. 歌曲详情 - 歌曲成绩单详情
125. 获取已购单曲
126. 获取已购专辑
127. 听书 - 搜索
128. 听书 -免费书库
129. 听书 -免费书库分类标签列表 
130. 修改个人资料
131. 修改头像
132. 批量查询概念版会员产品（YVipInfo）

## License

[The MIT License (MIT)](https://github.com/MakcRe/KuGouMusicApi/blob/main/LICENSE)
