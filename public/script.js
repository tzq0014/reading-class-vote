// =========================================
// 读书班投票系统 - 前端逻辑
// =========================================

const API_BASE = '/api';
const sessionsContainer = document.getElementById('sessionsContainer');
const resultsContainer = document.getElementById('resultsContainer');
const submitBtn = document.getElementById('submitBtn');
const statusMsg = document.getElementById('statusMsg');
const voteArea = document.getElementById('voteArea');
const resultArea = document.getElementById('resultArea');
const refreshBtn = document.getElementById('refreshBtn');

// 存储当前选中状态
let selections = {};  // { sessionId: optionId }
let sessions = [];

// ===== 加载投票数据 =====
async function loadVotes() {
  try {
    const res = await fetch(`${API_BASE}/votes`);
    const data = await res.json();
    sessions = data.sessions;
    renderSessions();
    updateSubmitState();
  } catch (err) {
    statusMsg.textContent = '⚠️ 加载失败，请刷新页面重试';
    statusMsg.className = 'status-msg error';
  }
}

// ===== 渲染投票卡片 =====
function renderSessions() {
  sessionsContainer.innerHTML = '';
  sessions.forEach((session, idx) => {
    const card = document.createElement('div');
    card.className = 'session-card';
    card.id = `session-${session.id}`;

    const titleHtml = `
      <div class="session-title">
        <span class="session-num">${idx + 1}</span>
        <h3>${session.title}</h3>
      </div>
      <div class="session-date">📅 ${session.date}</div>
      <div class="options-grid">
        ${session.options.map(opt => `
          <div class="option-item" data-session="${session.id}" data-option="${opt.id}" onclick="selectOption(${session.id}, '${opt.id}')">
            <div class="option-radio">
              <div class="option-radio-inner"></div>
            </div>
            <span class="option-label">${opt.label}</span>
          </div>
        `).join('')}
      </div>
    `;

    card.innerHTML = titleHtml;
    sessionsContainer.appendChild(card);
  });
}

// ===== 选择选项 =====
function selectOption(sessionId, optionId) {
  // 更新选中状态
  selections[sessionId] = optionId;

  // 更新UI
  const card = document.getElementById(`session-${sessionId}`);
  const items = card.querySelectorAll('.option-item');
  items.forEach(item => {
    const optId = item.dataset.option;
    if (optId === optionId) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });

  updateSubmitState();
}

// ===== 更新提交按钮状态 =====
function updateSubmitState() {
  const total = sessions.length;
  const selected = Object.keys(selections).length;
  submitBtn.disabled = selected < total;

  if (selected === 0) {
    submitBtn.innerHTML = `<span>请选择时间</span>`;
    statusMsg.textContent = '';
  } else if (selected < total) {
    submitBtn.innerHTML = `<span>已选 ${selected}/${total} 场</span>`;
    statusMsg.textContent = '';
  } else {
    submitBtn.innerHTML = `<span>✅ 提交投票</span>`;
    statusMsg.textContent = '✓ 所有场次已选好，可以提交了';
    statusMsg.className = 'status-msg success';
  }
}

// ===== 提交投票 =====
submitBtn.addEventListener('click', async () => {
  if (submitBtn.disabled) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>⏳ 提交中...</span>`;
  statusMsg.textContent = '';
  statusMsg.className = 'status-msg';

  let allSuccess = true;

  for (const [sessionId, optionId] of Object.entries(selections)) {
    try {
      const res = await fetch(`${API_BASE}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: parseInt(sessionId),
          optionId: optionId
        })
      });

      if (res.status === 409) {
        const errData = await res.json();
        statusMsg.textContent = `⚠️ ${errData.error}（跳转到结果页）`;
        statusMsg.className = 'status-msg error';
        allSuccess = false;
        break;
      }

      if (!res.ok) {
        throw new Error('投票失败');
      }
    } catch (err) {
      statusMsg.textContent = `⚠️ 提交失败，请重试`;
      statusMsg.className = 'status-msg error';
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>✅ 提交投票</span>`;
      return;
    }
  }

  if (allSuccess) {
    statusMsg.textContent = '🎉 投票成功！正在加载结果...';
    statusMsg.className = 'status-msg success';
    submitBtn.innerHTML = `<span>✅ 已提交</span>`;
    await showResults();
  } else {
    // 有冲突（重复投票），也展示结果
    submitBtn.innerHTML = `<span>✅ 查看结果</span>`;
    await showResults();
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
    // 滚动到结果区域
    resultArea.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    statusMsg.textContent = '⚠️ 加载结果失败，请刷新';
    statusMsg.className = 'status-msg error';
  }
}

// ===== 渲染结果 =====
function renderResults(sessions) {
  resultsContainer.innerHTML = '';

  sessions.forEach((session, idx) => {
    // 计算总票数
    const totalVotes = session.options.reduce((sum, o) => sum + o.votes, 0);
    // 找出最高票
    const maxVotes = Math.max(...session.options.map(o => o.votes));
    const winnerIds = session.options.filter(o => o.votes === maxVotes && maxVotes > 0).map(o => o.id);

    const bars = session.options.map(opt => {
      const pct = totalVotes > 0 ? (opt.votes / totalVotes * 100) : 0;
      const isWinner = winnerIds.includes(opt.id);
      return `
        <div class="option-bar">
          <span class="option-bar-label">${opt.label}</span>
          <div class="option-bar-track">
            <div class="option-bar-fill ${isWinner ? 'winner' : ''}" style="width: ${pct}%">
              ${pct >= 15 ? `<span>${Math.round(pct)}%</span>` : ''}
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
        <span class="num">${idx + 1}</span>
        <h3>${session.title} <span style="font-size:13px;color:var(--text-light);font-weight:400;">${session.date}</span></h3>
      </div>
      ${totalVotes === 0 ? '<p style="text-align:center;color:var(--text-light);padding:12px 0;">暂无投票数据</p>' : bars}
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

// ===== 初始化 =====
loadVotes();
