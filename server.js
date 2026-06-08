const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'votes.json');

// 初始化数据
function initData() {
  const defaultData = {
    sessions: [
      {
        id: 1,
        title: '文献：古籍资源检索技巧',
        date: '6月9日(周二)',
        options: [
          { id: '1a', label: '14:00-15:30', votes: 0 },
          { id: '1b', label: '18:00-20:30', votes: 0 },
          { id: '1c', label: '20:00-21:30', votes: 0 },
        ]
      },
      {
        id: 2,
        title: '文字：《诗经·伐檀》研读',
        date: '6月10日(周三)',
        options: [
          { id: '2a', label: '14:00-15:30', votes: 0 },
          { id: '2b', label: '16:00-17:30', votes: 0 },
          { id: '2c', label: '20:00-21:30', votes: 0 },
        ]
      },
      {
        id: 3,
        title: '文学：《文心雕龙·神思》研读',
        date: '6月11日(周四)',
        options: [
          { id: '3a', label: '14:00-15:30', votes: 0 },
          { id: '3b', label: '18:00-19:30', votes: 0 },
          { id: '3c', label: '20:00-21:30', votes: 0 },
        ]
      }
    ],
    voters: []  // 记录已投票的IP（简单防重复）
  };
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
  }
}

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 获取投票数据（不含voters列表）
app.get('/api/votes', (req, res) => {
  const data = loadData();
  res.json({ sessions: data.sessions });
});

// 投票
app.post('/api/vote', (req, res) => {
  const { sessionId, optionId } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!sessionId || !optionId) {
    return res.status(400).json({ error: '参数不完整' });
  }

  const data = loadData();

  // 简单防重复：同IP不能对同场读书班重复投票
  const alreadyVoted = data.voters.some(v => v.ip === ip && v.sessionId === sessionId);
  if (alreadyVoted) {
    return res.status(409).json({ error: '你已经对这场读书班投过票了' });
  }

  const session = data.sessions.find(s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: '找不到该场读书班' });
  }

  const option = session.options.find(o => o.id === optionId);
  if (!option) {
    return res.status(404).json({ error: '找不到该选项' });
  }

  option.votes += 1;
  data.voters.push({ ip, sessionId, optionId, time: new Date().toISOString() });
  saveData(data);

  res.json({ success: true, sessions: data.sessions });
});

// 重置投票（仅管理员调用方便测试）
app.post('/api/reset', (req, res) => {
  initData();
  res.json({ success: true, message: '已重置所有投票数据' });
});

initData();
app.listen(PORT, () => {
  console.log(`\n  ✅ 投票系统已启动！`);
  console.log(`  🌐 打开浏览器访问: http://localhost:${PORT}`);
  console.log(`  📱 手机同局域网访问: http://你的IP:${PORT}\n`);
});
