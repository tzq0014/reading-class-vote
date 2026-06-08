// =========================================
// 读书班投票系统 v2
// =========================================

const API_BASE = '/api';
const sessionsContainer = document.getElementById('sessionsContainer');
const resultsContainer = document.getElementById('resultsContainer');
const submitBtn = document.getElementById('submitBtn');
const statusMsg = document.getElementById('statusMsg');
const selectedHint = document.getElementById('selectedHint');
const voteArea = document.getElementById('voteArea');
const resultArea = document.getElementById('resultArea');
const refreshBtn = document.getElementById('refreshBtn');

let sessions = [];
// 当前选择: { sessionId: optionId }
let selections = {};

// ===== 启动检查：是否已投过票？ =====
(async function init() {
  // 检查 localStorage 是否有投票记录
  const hasVoted = localStorage.getItem('voted_reading_class') === 'true';
  
  try {
    const res = await fetch(`${API_BASE}/votes`);
    const data = await res.json();
    sessions = data.sessions;
    
    if (hasVoted) {
      // 已投票，直接显示结果
      renderResults(sessions);
      voteArea.classList.add('hidden');
      resultArea.classList.remove('hidden');
    } else {
      // 未投票，显示投票界面
      renderSessions();
      updateSubmitState();
    }
  } catch (err) {
    statusMsg.textContent = '⚠️ 加载失败，请刷新页面重试';
    statusMsg.className = 'status-msg error';
  }
})();

// ===== 渲染 =====
function renderSessions() {
  sessionsContainer.innerHTML = '';

  sessions.forEach((session, idx) => {
    const card = document.createElement('div');
    card.className = 'session-card';
    card.id = `session-${session.id}`;
    card.dataset.sessionId = session.id;

    // 头部：点击切换选中状态
    const header = document.createElement('div');
    header.className = 'session-header';
    header.innerHTML = `
      <div class="session-checkbox">✓</div>
      <div class="session-info">
        <div class="session-title-text">${session.title}</div>
        <div class="session-date-text">📅 ${session.date}</div>
      </div>
      <div class="session-toggle-icon">▾</div>
    `;
    header.addEventListener('click', () => toggleSession(session.id));

    // 选项区
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'session-options';
    const grid = document.createElement('div');
    grid.className = 'options-grid';

    session.options.forEach(opt => {
      const item = document.createElement('div');
      item.className = 'option-item';
      item.dataset.sessionId = session.id;
      item.dataset.optionId = opt.id;
      item.innerHTML = `
        <div class="option-radio">
          <div class="option-radio-inner"></div>
        </div>
        <span class="option-label">${opt.label}</span>
      `;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        selectOption(session.id, opt.id);
      });
      grid.appendChild(item);
    });

    optionsDiv.appendChild(grid);
    card.appendChild(header);
    card.appendChild(optionsDiv);
    sessionsContainer.appendChild(card);
  });
}

// ===== 切换场次选择 =====
function toggleSession(sessionId) {
  const card = document.getElementById(`session-${sessionId}`);
  const isActive = card.classList.contains('active');

  if (isActive) {
    // 取消选择：清除该场的选择
    card.classList.remove('active');
    delete selections[sessionId];
    // 清除时间选中状态
    const items = card.querySelectorAll('.option-item');
    items.forEach(item => item.classList.remove('selected'));
  } else {
    // 选择该场
    card.classList.add('active');
    // 如果该场之前已经有选中的时间（从selections恢复），高亮它
    const savedOpt = selections[sessionId];
    if (savedOpt) {
      const items = card.querySelectorAll('.option-item');
      items.forEach(item => {
        if (item.dataset.optionId === savedOpt) {
          item.classList.add('selected');
        }
      });
    }
  }

  updateSubmitState();
}

// ===== 选择时间 =====
function selectOption(sessionId, optionId) {
  const card = document.getElementById(`session-${sessionId}`);

  // 如果该场没被选中，不能选时间
  if (!card.classList.contains('active')) return;

  // 更新数据
  selections[sessionId] = optionId;

  // 更新 UI
  const items = card.querySelectorAll('.option-item');
  items.forEach(item => {
    if (item.dataset.optionId === optionId) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });

  updateSubmitState();
}

// ===== 更新提交状态 =====
function updateSubmitState() {
  const totalSelected = Object.keys(selections).length;

  if (totalSelected === 0) {
    selectedHint.textContent = '📌 点击上面的场次卡片，选择你要参加的读书班';
    selectedHint.className = 'selected-hint';
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>提交投票</span>`;
    statusMsg.textContent = '';
    return;
  }

  // 统计哪些场次选了时间
  let readyCount = 0;
  let pendingSessions = [];

  sessions.forEach(s => {
    if (selections[s.id]) {
      readyCount++;
    } else if (Object.keys(selections).includes(String(s.id))) {
      // 选中了场次但没选时间
      pendingSessions.push(s.title);
    }
  });

  const allReady = readyCount === totalSelected;

  if (allReady) {
    const names = sessions
      .filter(s => selections[s.id])
      .map(s => s.title.replace(/^[^：]*：/, '').replace(/研读$/, ''));
    selectedHint.textContent = `✅ 已选 ${readyCount} 场：${names.join('、')}`;
    selectedHint.className = 'selected-hint ok';
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>📨 提交投票</span>`;
    statusMsg.textContent = '';
  } else if (pendingSessions.length > 0) {
    selectedHint.textContent = `⚠️ 还有场次没有选择时间`;
    selectedHint.className = 'selected-hint';
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>请选择每场的时间</span>`;
    statusMsg.textContent = '';
  }
}

// ===== 提交投票 =====
submitBtn.addEventListener('click', async () => {
  if (submitBtn.disabled) return;

  // 组装投票数据
  const votes = [];
  for (const [sessionId, optionId] of Object.entries(selections)) {
    if (optionId) {
      votes.push({ sessionId: parseInt(sessionId), optionId });
    }
  }

  if (votes.length === 0) {
    statusMsg.textContent = '⚠️ 请至少选择一场读书班';
    statusMsg.className = 'status-msg error';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>⏳ 提交中...</span>`;
  statusMsg.textContent = '';
  statusMsg.className = 'status-msg';

  try {
    const res = await fetch(`${API_BASE}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes })
    });

    const data = await res.json();

    if (res.status === 409) {
      statusMsg.textContent = `⚠️ ${data.error}`;
      statusMsg.className = 'status-msg error';
      submitBtn.innerHTML = `<span>查看结果</span>`;
      // 还是展示结果
      await showResults();
      return;
    }

    if (!res.ok) {
      throw new Error(data.error || '投票失败');
    }

    // 保存到设备：这台设备已经投过票了
    localStorage.setItem('voted_reading_class', 'true');
    
    statusMsg.textContent = '🎉 投票成功！';
    statusMsg.className = 'status-msg success';
    submitBtn.innerHTML = `<span>✅ 已提交</span>`;
    await showResults();

  } catch (err) {
    statusMsg.textContent = `⚠️ 提交失败：${err.message}`;
    statusMsg.className = 'status-msg error';
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>📨 重试提交</span>`;
  }
});

// ===== 显示结果 =====
async function showResults() {
  try {
    const res = await fetch(`${API_BASE}/votes`);
    const data = await res.json();
    renderResults(data.sessions);
    voteArea.classList.add('hidden');
    resultArea.classList.remove('hidden');
    resultArea.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    statusMsg.textContent = '⚠️ 加载结果失败';
    statusMsg.className = 'status-msg error';
  }
}

// ===== 渲染结果 =====
function renderResults(sessions) {
  resultsContainer.innerHTML = '';

  sessions.forEach((session) => {
    const totalVotes = session.options.reduce((sum, o) => sum + o.votes, 0);
    const maxVotes = Math.max(...session.options.map(o => o.votes));
    const winnerIds = maxVotes > 0
      ? session.options.filter(o => o.votes === maxVotes).map(o => o.id)
      : [];

    const bars = session.options.map(opt => {
      const pct = totalVotes > 0 ? (opt.votes / totalVotes * 100) : 0;
      const isWinner = winnerIds.includes(opt.id);
      return `
        <div class="option-bar">
          <span class="option-bar-label">${opt.label}</span>
          <div class="option-bar-track">
            <div class="option-bar-fill ${isWinner ? 'winner' : ''}" style="width: ${Math.max(pct, 2)}%">
              ${pct >= 12 ? `<span>${Math.round(pct)}%</span>` : ''}
            </div>
          </div>
          <span class="option-bar-votes">${opt.votes}票 ${isWinner ? '👑' : ''}</span>
        </div>
      `;
    }).join('');

    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
      <div class="result-card-title">
        <h3>${session.title} <span class="result-date">${session.date}</span></h3>
      </div>
      ${totalVotes === 0
        ? '<p style="text-align:center;color:var(--text-light);padding:12px 0;">暂无投票数据</p>'
        : bars
      }
      <p style="text-align:right;font-size:12px;color:var(--text-light);margin-top:8px;">共 ${totalVotes} 票</p>
    `;
    resultsContainer.appendChild(card);
  });
}

// ===== 刷新结果 =====
refreshBtn.addEventListener('click', async () => {
  refreshBtn.disabled = true;
  refreshBtn.textContent = '⏳ 刷新中...';
  await showResults();
  refreshBtn.disabled = false;
  refreshBtn.textContent = '🔄 刷新结果';
});


