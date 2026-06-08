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
        title: '古籍资源检索技巧',
        date: '6月9日(周二)',
        options: [
          { id: '1a', label: '18:00-19:30', votes: 0 },
          { id: '1b', label: '19:00-20:30', votes: 0 },
          { id: '1c', label: '20:00-21:30', votes: 0 },
        ]
      },
      {
        id: 2,
        title: '《毛诗注疏·伐檀》研读',
        date: '6月10日(周三)',
        options: [
          { id: '2a', label: '14:00-15:30', votes: 0 },
          { id: '2b', label: '16:00-17:30', votes: 0 },
          { id: '2c', label: '20:00-21:30', votes: 0 },
        ]
      },
      {
        id: 3,
        title: '《文心雕龙·神思》导读',
        date: '6月11日(周四)',
        options: [
          { id: '3a', label: '14:00-15:30', votes: 0 },
          { id: '3b', label: '18:00-19:30', votes: 0 },
          { id: '3c', label: '20:00-21:30', votes: 0 },
        ]
      }
    ],
    voters: []  // { ip, selections: [{sessionId, optionId}], time }
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

// 批量投票 — 一次提交多场
app.post('/api/vote', (req, res) => {
  const { votes } = req.body;  // [{ sessionId, optionId }]
  const ip = req.ip || req.connection.remoteAddress;

  if (!votes || !Array.isArray(votes) || votes.length === 0) {
    return res.status(400).json({ error: '请至少选择一场读书班' });
  }

  const data = loadData();

  // 防重复：同IP只能投一次
  const alreadyVoted = data.voters.some(v => v.ip === ip);
  if (alreadyVoted) {
    return res.status(409).json({ error: '你已经投过票了，感谢参与' });
  }

  // 验证每个投票
  for (const v of votes) {
    const session = data.sessions.find(s => s.id === v.sessionId);
    if (!session) {
      return res.status(404).json({ error: `找不到读书班 ID: ${v.sessionId}` });
    }
    const option = session.options.find(o => o.id === v.optionId);
    if (!option) {
      return res.status(404).json({ error: `找不到选项: ${v.optionId}` });
    }
    option.votes += 1;
  }

  data.voters.push({
    ip,
    selections: votes,
    time: new Date().toISOString()
  });
  saveData(data);

  res.json({ success: true, sessions: data.sessions });
});

// 重置投票
app.post('/api/reset', (req, res) => {
  initData();
  res.json({ success: true, message: '已重置所有投票数据' });
});

initData();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ✅ 投票系统已启动！`);
  console.log(`  🌐 本地访问: http://localhost:${PORT}`);
  console.log(`  📱 局域网访问: http://你的IP:${PORT}\n`);
});
