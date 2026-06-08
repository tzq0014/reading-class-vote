# 📖 读书班时间投票系统

《中华优秀传统文化导论》课程配套读书班 — 投票确定每场读书班的时间段。

## 🔗 链接

| 平台 | 地址 |
|------|------|
| 🌍 **线上页面** | https://reading-class-vote-production.up.railway.app |
| 💻 **GitHub 仓库** | https://github.com/tzq0014/reading-class-vote |
| 🏠 **本地访问** | http://localhost:3000 |

## 📁 项目结构

```
vote-system/
├── server.js          # 后端服务（Express）
├── package.json       # 项目配置
├── votes.json         # 投票数据（自动生成）
├── README.md          # 本文件
├── render.yaml        # Render 部署配置（暂未使用）
├── public/
│   ├── index.html     # 前端页面
│   ├── script.js      # 前端交互逻辑
│   └── style.css      # 样式
└── node_modules/      # 依赖（自动生成）
```

## 🚀 如何更新（日常操作）

修改本地代码后，三步推送到线上：

```bash
# 1. 添加所有修改
git add .

# 2. 提交（说明改了什么）
git commit -m "这里写你改了什么"

# 3. 推送到 GitHub（Railway 会自动部署）
git push
```

> ⚡ Railway 已关联 GitHub，推送后自动部署，无需额外操作。

## 🏃 本地运行

```bash
cd /Users/taozhengquan/vote-system
node server.js
```

然后浏览器打开 http://localhost:3000

## 🔄 重置投票数据

删除 `votes.json` 文件，重启服务即可：

```bash
rm votes.json
node server.js
```

## 📌 功能说明

- 自愿参加，至少参加一场，多选不限
- 每场选择一个能参加的时间段，得票最多的即为该场举办时间
- 每人不限设备，只统计一次投票（按 IP 去重）
