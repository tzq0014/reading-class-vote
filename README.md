# 📖 读书班时间投票系统

> ⚠️ **项目所有者不懂技术，只会通过语言与 AI 编程代理沟通。**
> 任何修改、部署、排错都必须由 AI 代理完成，用户只提供需求描述。
> 请阅读本 README 全文以完整了解项目后再进行操作。

---

## 一、项目是什么

《中华优秀传统文化导论》课程配套读书班的投票工具。

- **用途**：同学投票选择每场读书班的时间段
- **核心规则**：
   - 🕐 **每个时间段恰好 1.5 小时**（如 18:00-19:30、19:00-20:30）
   - 📱 **适配手机端**：页面在手机上自适应显示，按钮和选项适合手指触摸
   - 🚫 **一台设备只能投一次**：投票后浏览器会记住，再次打开直接显示上次的结果
- **功能**：列出 3 场读书班，每场有 3 个时间段可选，每人可投多场
- **防重复**：双重保障——①浏览器 localStorage 记录（换浏览器可再投）②后端 IP 记录（同一网络只能投一次）
- **交互**：两步操作——①点击卡片选中场次 ②在该场下点击选择时间段 → 提交

---

## 二、链接

| 项目 | 地址 |
|------|------|
| 🌍 **线上页面（已部署）** | https://reading-class-vote-production.up.railway.app |
| 💻 **GitHub 仓库** | https://github.com/tzq0014/reading-class-vote |
| 🏠 **本地开发地址** | http://localhost:3000 |

---

## 三、技术栈

- **后端**：Node.js + Express（单文件 `server.js`）
- **前端**：纯 HTML / CSS / JavaScript（无框架，在 `public/` 目录下）
- **数据存储**：本地 JSON 文件 `votes.json`
- **部署**：Railway（关联 GitHub，自动部署）
- **依赖**：仅 `express`（见 `package.json`）

---

## 四、项目结构

```
/Users/taozhengquan/vote-system/
│
├── server.js            ← 后端服务（Express，监听 3000 端口）
├── package.json         ← Node.js 项目配置（依赖: express）
├── package-lock.json    ← 依赖版本锁定（自动生成，不要手动改）
├── votes.json           ← 投票数据（自动生成，可删除重置）
├── README.md            ← 本文件（项目说明书）
├── render.yaml          ← Render 部署配置（暂未使用，当前用 Railway）
├── .gitignore           ← Git 忽略规则
│
├── public/              ← 前端静态文件（express.static 托管）
│   ├── index.html       ← 页面结构
│   ├── script.js        ← 前端交互逻辑
│   └── style.css        ← 页面样式
│
└── node_modules/        ← 依赖包（npm install 自动生成，不用管）
```

---

## 五、本地运行方法

```bash
# 1. 进入项目目录
cd /Users/taozhengquan/vote-system

# 2. 启动服务
node server.js

# 3. 浏览器打开
#    http://localhost:3000
```

如果提示 `port 3000 already in use`（端口被占用），先关掉旧进程：

```bash
kill $(lsof -ti:3000)
node server.js
```

---

## 六、后端 API 接口

### `GET /api/votes`
获取当前投票数据（不含 voters 列表，保护隐私）。

返回示例：
```json
{
  "sessions": [
    {
      "id": 1,
      "title": "文献：古籍资源检索技巧",
      "date": "6月9日(周二)",
      "options": [
        { "id": "1a", "label": "18:00-19:30", "votes": 5 },
        { "id": "1b", "label": "19:00-20:30", "votes": 3 },
        { "id": "1c", "label": "20:00-21:30", "votes": 7 }
      ]
    }
  ]
}
```

### `POST /api/vote`
提交投票（批量提交多场）。

请求体：
```json
{
  "votes": [
    { "sessionId": 1, "optionId": "1c" },
    { "sessionId": 2, "optionId": "2b" }
  ]
}
```

响应：
- `200` → `{ "success": true, "sessions": [...] }`
- `400` → `{ "error": "请至少选择一场读书班" }`（参数错误）
- `409` → `{ "error": "你已经投过票了，不能重复投票" }`（IP 重复）
- `404` → `{ "error": "找不到读书班 ID: xxx" }`（ID 错误）

### `POST /api/reset`
重置所有投票数据为初始状态（所有选项票数归零，清空投票记录）。

---

## 七、读书班场次数据

当前固定在 `server.js` 的 `initData()` 函数中，共 3 场：

| 场次 ID | 标题 | 日期 | 选项（每个都是 1.5 小时） |
|---------|------|------|------|
| 1 | 文献：古籍资源检索技巧 | 6月9日(周二) | 1a:18:00-19:30 / 1b:19:00-20:30 / 1c:20:00-21:30 |
| 2 | 文字：《诗经·伐檀》研读 | 6月10日(周三) | 2a:14:00-15:30 / 2b:16:00-17:30 / 2c:20:00-21:30 |
| 3 | 文学：《文心雕龙·神思》研读 | 6月11日(周四) | 3a:14:00-15:30 / 3b:18:00-19:30 / 3c:20:00-21:30 |

> ✅ **所有时间段都是 1.5 小时**（例如 18:00-19:30 = 1.5h，19:00-20:30 = 1.5h，以此类推）

> ⚠️ **如果要修改场次、日期或选项**：编辑 `server.js` 中 `initData()` 函数里的 `defaultData` 对象，然后删掉 `votes.json` 重启服务。

---

## 八、数据存储

- 文件：`votes.json`（在项目根目录，被 `.gitignore` 忽略，不会提交到 GitHub）
- 结构：包含 `sessions`（场次及票数）和 `voters`（投票人 IP 及选择）
- **重置数据**：删除此文件后重启服务，会自动用默认数据重新创建
- **注意**：Railway 线上环境的 `votes.json` 和本地是独立的，互不影响

---

## 九、Git 提交历史

```
de4323d docs: 添加项目说明 README                    ← 当前
8fe2de2 refactor: 重构为批量投票 + 先选场次再选时间交互  ← 主要修改
06623e2 add render.yaml for easy deployment
10fc649 init: 读书班投票系统                          ← 初始提交
```

---

## 十、GitHub 操作（日常更新流程）

用户不懂技术，任何修改都通过 AI 代理完成。标准的提交流程：

```bash
# 1. 添加所有改动
git add .

# 2. 提交（提交信息要写清楚改了什么，用中文）
git commit -m "改了什么，例如：修改了第一场的时间选项"

# 3. 推送到 GitHub
git push
```

> ⚠️ **注意**：`votes.json` 在 `.gitignore` 中，不会被提交。所以线上和本地的投票数据是独立的。

---

## 十一、Railway 部署

### 概况
- 平台：Railway（免费版）
- 项目名：`reading-class-vote`
- 项目 ID：`26924fcd`（可能失效，以实际为准）
- 关联方式：通过 GitHub 仓库自动部署（GitHub Integration）
- **自动部署**：每次 `git push` 到 `main` 分支，Railway 自动构建并更新

### 部署配置（在 Railway 网页控制台中设置）
- Build 命令：`npm install`
- Start 命令：`node server.js`
- 区域：sfo（旧金山）
- 实例数：1

### 已知问题
- CLI 无法直接管理此项目（免费版限制），所有配置需在网页端 https://railway.app 操作
- 网页端登录邮箱：`taozhengquan0014@gmail.com`

### 环境变量
- 当前为 0 个环境变量
- 如果需要设置（如密码保护等），在 Railway 网页控制台添加

---

## 十二、代码细节（供 AI 代理参考）

### 核心特性一：每个时间段都是 1.5 小时
- 所有时间段的起止时间差值均为 1.5 小时
- 例如：18:00-19:30、19:00-20:30、20:00-21:30、14:00-15:30、16:00-17:30
- 数据在 `server.js` 的 `initData()` 中定义

### 核心特性二：适配移动端
- 页面 `<head>` 中有 `<meta name="viewport">` 标签，禁止缩放，适合手机屏幕
- CSS 中有 `@media (max-width: 480px)` 响应式样式，小屏设备会自动调整间距、字号、按钮大小
- 卡片式设计，触摸友好（选项和按钮都有 `:active` 触摸反馈）
- `user-select: none` 和 `-webkit-tap-highlight-color: transparent` 优化触摸体验

### 核心特性三：一台设备不能重复投票
**双重防重复机制：**

1. **浏览器本地记录（前端）**：
   - 投票成功后，在浏览器的 `localStorage` 中写入 `voted_reading_class = true`
   - 下次同一设备打开页面时，`init()` 函数检测到这个标记，**直接显示结果页面**，不显示投票界面
   - 换一个浏览器（或清除浏览器数据）可以再投

2. **IP 记录（后端）**：
   - 基于 IP 地址去重（`req.ip`）
   - 同 IP 只能投票一次（全局，不是每场一次）
   - 投票记录存在 `votes.json` 的 `voters` 数组中
   - 重复投票返回 HTTP 409 错误：`{"error": "你已经投过票了，不能重复投票"}`

### 已知的小问题（暂未修复）
在 `public/script.js` 的 `updateSubmitState()` 函数中：
```javascript
sessions.forEach(s => {
    if (selections[s.id]) {
      readyCount++;
    } else if (Object.keys(selections).includes(String(s.id))) {
      // ↓ 这段代码永远不会执行
      // 因为 selections 中只有在选了时间后才会写入条目
      // 如果场次被选中但没选时间，selections 里根本没有该场次的 key
      pendingSessions.push(s.title);
    }
  });
```
- 效果：选择场次后不选时间直接提交，会提示"请至少选择一场读书班"
- 但实际上用户必须选时间才能提交（按钮 disabled），所以不影响使用
- 未来修复方向：`toggleSession` 选中场次时就在 `selections` 里写入 `{sessionId: null}` 占位

---

## 十三、常见任务指南（AI 代理直接参考）

### 用户说"帮我加一场读书班"
→ 编辑 `server.js` 的 `initData()`，在 `sessions` 数组里新增一个对象（格式参考已有的），删掉 `votes.json` 重启

### 用户说"投票数据乱了，重置一下"
→ 删掉 `votes.json`，重启服务

### 用户说"我要改某个时间选项"
→ 编辑 `server.js` 的 `initData()` → 删 `votes.json` → 重启

### 用户说"部署到线上"
→ `git add .` → `git commit -m "xxx"` → `git push`（Railway 自动部署）

### 用户说"我想加个管理员密码"
→ 需要修改 `server.js`，在 `/api/reset` 等接口加 token 验证，并在 Railway 设置环境变量

### 用户说"页面样式不好看"
→ 编辑 `public/style.css`

### 用户说"报错了/打不开了"
→ 先检查本地 `http://localhost:3000` 是否正常运行
→ `curl http://localhost:3000/api/votes` 测试 API
→ 查看终端是否有报错信息
→ 如果是线上出问题，先检查本地是否正常

---

## 十四、用户画像（重要）

- **不懂任何技术**：不知道什么是端口、部署、git、命令行
- **只会用自然语言沟通**：跟 AI 代理说"帮我改一下""这个不好看""报错了"
- **电脑里有多个 AI 编程工具**：可能用不同的 AI 代理操作同一个项目
- **项目目录**：`/Users/taozhengquan/vote-system/`
- **电脑系统**：macOS，用户名 `taozhengquan`

---

*最后更新：2026-06-08*
*由 AI 编程代理协助维护*
