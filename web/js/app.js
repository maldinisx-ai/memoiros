/**
 * App Entry Point - 应用入口（非模块版本）
 * 全局状态管理、路由初始化、事件总线
 */

// ============================================
// Application State
// ============================================

const appState = {
  currentPanel: 'interview',
  currentPhase: 'warmup',
  interviewId: null,
  userId: null,
  identifier: null,
  answeredCount: 0,
  eventCount: 0,
  userProfile: null,
  memoirOutline: null,
  selectedChapter: null,
};

// ============================================
// Utility Functions
// ============================================

/**
 * Encode identifier (name/email/phone) to safe user ID
 * Supports Chinese characters using Base64 encoding
 */
function encodeIdentifier(identifier) {
  // For alphanumeric input (emails, phones), keep as-is but lowercase
  if (/^[a-zA-Z0-9@._-]+$/.test(identifier)) {
    return identifier.toLowerCase();
  }

  // Base64 encoding that supports Unicode/Chinese characters
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  const str = unescape(encodeURIComponent(identifier));
  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = str.charCodeAt(i++);
    const c = str.charCodeAt(i++);
    const b1 = a >> 2;
    const b2 = ((a & 3) << 4) | (b >> 4);
    const b3 = ((b & 15) << 2) | (c >> 6);
    const b4 = c & 63;
    result += chars.charAt(b1) + chars.charAt(b2) + chars.charAt(b3) + chars.charAt(b4);
  }

  // Remove special chars that might cause issues in URLs/paths
  return result.replace(/[+/=]/g, '').toLowerCase();
}

// ============================================
// API Client with Error Handling
// ============================================

const API_BASE = 'http://localhost:3000/api';

class APIError extends Error {
  constructor(code, message, details = [], status) {
    super(message);
    this.code = code;
    this.details = details;
    this.status = status;
    this.name = 'APIError';
  }

  getUserMessage() {
    const messages = {
      'VALIDATION_ERROR': '请检查输入数据是否正确',
      'INVALID_INPUT': '输入数据格式不正确',
      'UNAUTHORIZED': '请先登录',
      'NOT_FOUND': '请求的资源不存在',
      'INTERNAL_ERROR': '服务器错误，请稍后重试',
      'LLM_ERROR': 'AI 服务暂时不可用，请稍后重试',
      'NETWORK_ERROR': '网络连接失败，请检查网络设置',
      'SESSION_EXPIRED': '会话已过期，请重新登录',
    };
    return messages[this.code] || this.message;
  }

  isValidationError() {
    return this.code === 'VALIDATION_ERROR';
  }

  getFirstFieldError() {
    if (this.details && this.details.length > 0) {
      return this.details[0].message;
    }
    return null;
  }
}

async function apiRequest(url, options = {}) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      if (data.error) {
        throw new APIError(
          data.error.code,
          data.error.message,
          data.error.details,
          response.status
        );
      }
      throw new APIError(
        'UNKNOWN_ERROR',
        data.message || data.error || '请求失败',
        [],
        response.status
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'NETWORK_ERROR',
      error.message || '网络连接失败，请检查网络设置',
      [],
      0
    );
  }
}

// ============================================
// Toast Notification System
// ============================================

function showToast(type, title, message, duration = 4000) {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, duration);

  return toast;
}

const toast = {
  success: (title, message, duration) => showToast('success', title, message, duration),
  error: (title, message, duration) => showToast('error', title, message, duration),
  warning: (title, message, duration) => showToast('warning', title, message, duration),
  info: (title, message, duration) => showToast('info', title, message, duration),
};

// ============================================
// Loading States
// ============================================

function showLoading(message = '处理中...') {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  loadingText.textContent = message;
  loadingOverlay.classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

function setButtonLoading(button, isLoading, originalText = '') {
  if (isLoading) {
    button.classList.add('loading');
    button.dataset.originalText = button.textContent;
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
    button.textContent = button.dataset.originalText || originalText;
  }
}

function showPanelLoading(panelId) {
  const panel = document.getElementById(`panel-${panelId}`);
  if (!panel) return;

  const content = panel.querySelector('.panel-content, .profile-panel, .outline-panel, .chapter-panel');
  if (content) {
    content.style.display = 'none';
  }

  let loading = panel.querySelector('.panel-loading');
  if (!loading) {
    loading = document.createElement('div');
    loading.className = 'panel-loading';
    loading.innerHTML = `
      <div class="loading-spinner"></div>
      <div>加载中...</div>
    `;
    panel.appendChild(loading);
  }
  loading.classList.add('active');
}

function hidePanelLoading(panelId) {
  const panel = document.getElementById(`panel-${panelId}`);
  if (!panel) return;

  const loading = panel.querySelector('.panel-loading');
  if (loading) {
    loading.classList.remove('active');
  }

  const content = panel.querySelector('.panel-content, .profile-panel, .outline-panel, .chapter-panel');
  if (content) {
    content.style.display = '';
  }
}

// ============================================
// Auto-save & Persistence
// ============================================

const PROGRESS_KEY = 'memoiros_progress';
const DRAFT_KEY = 'memoiros_draft';

const autoSave = {
  timer: null,
  delay: 2000,
  isSaving: false,

  schedule(callback) {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.execute(callback);
    }, this.delay);
  },

  async execute(callback) {
    if (this.isSaving) {
      this.schedule(callback);
      return;
    }

    this.isSaving = true;
    const indicator = document.querySelector('.auto-save-indicator');
    if (indicator) {
      indicator.classList.add('saving');
    }

    try {
      await callback();
    } finally {
      this.isSaving = false;
      if (indicator) {
        setTimeout(() => {
          indicator.classList.remove('saving');
        }, 1000);
      }
    }
  },

  cancel() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
};

function saveProgress() {
  if (!appState.userId || !appState.interviewId) return;

  const progress = {
    currentPanel: appState.currentPanel,
    currentPhase: appState.currentPhase,
    interviewId: appState.interviewId,
    userId: appState.userId,
    answeredCount: appState.answeredCount,
    eventCount: appState.eventCount,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Failed to save progress:', e);
  }
}

function loadProgress() {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (!saved) return null;

    const progress = JSON.parse(saved);

    const isRecent = Date.now() - progress.timestamp < 24 * 60 * 60 * 1000;
    const isSameUser = progress.userId === appState.userId;

    if (isSameUser && isRecent) {
      return progress;
    }
  } catch (e) {
    console.warn('Failed to load progress:', e);
  }
  return null;
}

function saveDraft(input) {
  if (!appState.userId) return;

  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      userId: appState.userId,
      interviewId: appState.interviewId,
      draft: input,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to save draft:', e);
  }
}

function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return null;

    const draft = JSON.parse(saved);

    if (draft.userId === appState.userId && draft.interviewId === appState.interviewId) {
      if (Date.now() - draft.timestamp < 60 * 60 * 1000) {
        return draft.draft;
      }
    }
  } catch (e) {
    console.warn('Failed to load draft:', e);
  }
  return null;
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    console.warn('Failed to clear draft:', e);
  }
}

// ============================================
// Formatting Helpers
// ============================================

function getStatusLabel(status) {
  const labels = {
    'draft': '草稿',
    'published': '已发布',
    'archived': '已归档'
  };
  return labels[status] || status;
}

function getTypeLabel(type) {
  const labels = {
    'prologue': '序言',
    'childhood': '童年',
    'education': '教育',
    'career': '职业',
    'family': '家庭',
    'travel': '旅行',
    'reflections': '回顾',
    'epilogue': '结语',
    'other': '其他'
  };
  return labels[type] || type;
}

function getChapterPreview(content) {
  const maxLength = 150;
  const text = content.replace(/\n/g, ' ').trim();
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatChapterContent(content) {
  return content.split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p>${p}</p>`)
    .join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightSearchTerms(text, query) {
  if (!query) return text;
  const terms = query.split(/\s+/).filter(t => t.length > 1);
  if (terms.length === 0) return text;

  const pattern = new RegExp(`(${terms.join('|')})`, 'gi');
  return text.replace(pattern, '<mark>$1</mark>');
}

// ============================================
// DOM Elements
// ============================================

const statusEl = document.getElementById('status');
const modelInfoEl = document.getElementById('modelInfo');
const answeredCountEl = document.getElementById('answeredCount');
const eventCountEl = document.getElementById('eventCount');

// ============================================
// Message Display
// ============================================

function addMessage(content, isUser = false) {
  const messagesContainer = document.getElementById('messages');
  const typingIndicator = document.getElementById('typing');

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'agent'}`;
  messageDiv.innerHTML = `
    <div class="avatar ${isUser ? 'user' : 'agent'}">${isUser ? '👤' : '🤖'}</div>
    <div class="message-content">${content}</div>
  `;
  messagesContainer.insertBefore(messageDiv, typingIndicator);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function setTyping(show) {
  const typingIndicator = document.getElementById('typing');
  if (show) {
    typingIndicator.classList.add('active');
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
  } else {
    typingIndicator.classList.remove('active');
  }
}

function switchToPanel(panelName) {
  const panelItem = document.querySelector(`[data-panel="${panelName}"]`);
  if (panelItem) {
    panelItem.click();
  }
}

// ============================================
// Interview Module
// ============================================

function sendMessage() {
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const content = userInput.value.trim();

  if (!content) return;

  clearDraft();
  addMessage(content, true);
  userInput.value = '';
  sendBtn.disabled = true;
  setTyping(true);
  statusEl.textContent = '正在处理...';

  sendMessageStream(content)
    .then(data => {
      if (data.phase && data.phase !== appState.currentPhase) {
        appState.currentPhase = data.phase;
        // Show toast notification when phase changes
        const phaseNames = {
          warmup: '热身',
          childhood: '童年',
          education: '教育',
          career: '职业',
          family: '家庭',
          milestones: '里程碑',
          reflections: '回顾',
          closing: '收尾'
        };
        toast.success('话题已更新', `已自动切换到「${phaseNames[data.phase]}」话题`);
      }

      appState.answeredCount++;
      answeredCountEl.textContent = appState.answeredCount;
      statusEl.textContent = '准备就绪';
      saveProgress();
    })
    .catch(error => {
      setTyping(false);

      let errorMessage = '抱歉，处理你的回答时出现了错误。请稍后再试。';
      if (error instanceof APIError) {
        errorMessage = error.getUserMessage();
        toast.error('请求失败', errorMessage);
      } else if (error.message) {
        errorMessage = `错误: ${error.message}`;
      }

      addMessage(errorMessage);
      statusEl.textContent = '错误';
      console.error('Error:', error);
    })
    .finally(() => {
      sendBtn.disabled = false;
    });
}

function sendMessageStream(answer) {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(
      `${API_BASE}/interview/process/stream?interviewId=${encodeURIComponent(appState.interviewId)}&answer=${encodeURIComponent(answer)}`
    );

    let responseData = null;

    eventSource.addEventListener('start', (e) => {
      const data = JSON.parse(e.data);
      statusEl.textContent = data.message || '正在处理...';
    });

    eventSource.addEventListener('question', (e) => {
      const data = JSON.parse(e.data);
      responseData = data;

      setTyping(false);

      if (data.nextQuestion) {
        addMessage(data.nextQuestion || '感谢你的分享！');
      }

      if (data.phase && data.phase !== appState.currentPhase) {
        appState.currentPhase = data.phase;
      }

      statusEl.textContent = '准备就绪';
      resolve(data);
    });

    eventSource.addEventListener('error', (e) => {
      eventSource.close();
      setTyping(false);

      const data = e.data ? JSON.parse(e.data) : {};
      const error = new APIError(
        data.code || 'STREAM_ERROR',
        data.error || '流式连接错误',
        data.details || [],
        0
      );
      reject(error);
    });

    eventSource.addEventListener('done', () => {
      eventSource.close();
      if (!responseData) {
        resolve({});
      }
    });

    eventSource.onerror = (error) => {
      eventSource.close();
      setTyping(false);
      reject(new Error('连接中断，请重试'));
    };

    setTimeout(() => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
        setTyping(false);
        reject(new Error('请求超时，请重试'));
      }
    }, 60000);
  });
}

// ============================================
// Profile Module
// ============================================

async function generateProfile() {
  const generateProfileBtn = document.getElementById('generateProfileBtn');

  if (appState.answeredCount === 0) {
    toast.warning('无法生成', '请先完成一些采访问题！');
    return;
  }

  generateProfileBtn.disabled = true;
  statusEl.textContent = '正在生成用户画像...';

  try {
    const response = await fetch(`${API_BASE}/preprocess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: appState.userId,
        interviewId: appState.interviewId,
        includeTimeline: true,
        includeVoiceProfile: true,
      }),
    });

    const data = await response.json();
    appState.userProfile = data.profile;
    renderProfile(data);
    statusEl.textContent = '用户画像生成完成';
    toast.success('生成成功', '用户画像已生成！');
  } catch (error) {
    console.error('Failed to generate profile:', error);
    toast.error('生成失败', '生成用户画像失败，请稍后再试。');
    statusEl.textContent = '错误';
  } finally {
    generateProfileBtn.disabled = false;
  }
}

function renderProfile(data) {
  const profileContent = document.getElementById('profileContent');
  const { profile, summary, suggestions } = data;

  profileContent.innerHTML = `
    <div class="profile-section">
      <h3>📋 摘要</h3>
      <div style="line-height: 1.8;">${summary || '暂无摘要'}</div>
    </div>

    <div class="profile-section">
      <h3>👤 基本信息</h3>
      <div class="profile-grid">
        <div class="profile-item">
          <div class="profile-label">出生年份</div>
          <div class="profile-value">${profile.basicInfo.birthYear || '未知'}</div>
        </div>
        <div class="profile-item">
          <div class="profile-label">出生月份</div>
          <div class="profile-value">${profile.basicInfo.birthMonth || '未知'}</div>
        </div>
        <div class="profile-item">
          <div class="profile-label">出生地点</div>
          <div class="profile-value">${profile.basicInfo.birthPlace || '未知'}</div>
        </div>
        <div class="profile-item">
          <div class="profile-label">教育背景</div>
          <div class="profile-value">${profile.basicInfo.education || '未知'}</div>
        </div>
        <div class="profile-item">
          <div class="profile-label">职业经历</div>
          <div class="profile-value">${profile.basicInfo.career || '未知'}</div>
        </div>
      </div>
    </div>

    <div class="profile-section">
      <h3>📅 时间线事件</h3>
      <div style="max-height: 300px; overflow-y: auto;">
        ${profile.timeline.map(event => `
          <div style="padding: 10px; border-left: 3px solid #667eea; background: #f8f9fa; border-radius: 0 8px 8px 0; margin-bottom: 10px;">
            <div style="font-size: 12px; color: #6c757d;">${event.date.year || ''}年${event.date.month || ''}</div>
            <div style="font-weight: 600;">${event.title}</div>
            <div style="font-size: 13px; color: #6c757d; margin-top: 5px;">${event.description || ''}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="profile-section">
      <h3>🎯 核心主题</h3>
      <div class="outline-themes">
        ${profile.themes.map(theme => `
          <span class="theme-tag">${theme.theme}</span>
        `).join('')}
      </div>
    </div>

    ${suggestions ? `
    <div class="profile-section">
      <h3>💡 改进建议</h3>
      <ul style="padding-left: 20px; line-height: 1.8;">
        ${suggestions.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  `;
}

// ============================================
// Outline Module
// ============================================

async function generateOutline() {
  const generateOutlineBtn = document.getElementById('generateOutlineBtn');

  if (!appState.userProfile) {
    toast.warning('无法生成', '请先生成用户画像！');
    return;
  }

  generateOutlineBtn.disabled = true;
  statusEl.textContent = '正在生成回忆录大纲...';

  try {
    const response = await fetch(`${API_BASE}/memoir/outline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: appState.userId,
        interviewId: appState.interviewId,
        targetChapters: 10,
        structure: 'chronological',
      }),
    });

    const data = await response.json();
    appState.memoirOutline = data.outline;
    renderOutline(data.outline);
    statusEl.textContent = '大纲生成完成';
    toast.success('生成成功', '回忆录大纲已生成！');
  } catch (error) {
    console.error('Failed to generate outline:', error);
    toast.error('生成失败', '生成大纲失败，请稍后再试。');
    statusEl.textContent = '错误';
  } finally {
    generateOutlineBtn.disabled = false;
  }
}

function renderOutline(outline) {
  const outlineContent = document.getElementById('outlineContent');

  outlineContent.innerHTML = `
    <div class="outline-header">
      <div>
        <div class="outline-title">${outline.title}</div>
        <div class="outline-subtitle">${outline.subtitle}</div>
      </div>
    </div>

    ${outline.summary ? `
    <div class="outline-summary">
      <strong>简介：</strong>${outline.summary}
    </div>
    ` : ''}

    ${outline.themes && outline.themes.length > 0 ? `
    <div class="outline-section">
      <h3>🎯 核心主题</h3>
      <div class="outline-themes">
        ${outline.themes.map(theme => `<span class="theme-tag">${theme}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 18px; margin-bottom: 15px;">章节规划</h3>
      ${outline.chapters.map(chapter => `
        <div class="chapter-item">
          <div class="chapter-header">
            <span class="chapter-number">${chapter.chapterNumber}</span>
            <span class="chapter-title">${chapter.title}</span>
            <span class="chapter-period">${chapter.period.start} - ${chapter.period.end}</span>
          </div>
          <div class="chapter-focus">${chapter.focus}</div>
          <div class="chapter-meta">
            <span class="chapter-words">${chapter.estimatedWords} 字</span>
            <button class="write-btn" data-chapter="${chapter.chapterNumber}">📝 撰写</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  document.querySelectorAll('.write-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const chapterNumber = parseInt(btn.dataset.chapter);
      writeChapter(chapterNumber);
    });
  });
}

async function writeChapter(chapterNumber) {
  const chapter = appState.memoirOutline.chapters.find(c => c.chapterNumber === chapterNumber);
  if (!chapter) return;

  switchToPanel('chapter');

  const chapterContent = document.getElementById('chapterContent');
  chapterContent.innerHTML = `
    <div class="chapter-panel">
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 48px; margin-bottom: 20px;">✍️</div>
        <div style="font-size: 18px; color: #6c757d;">正在撰写第 ${chapterNumber} 章...</div>
        <div style="font-size: 14px; color: #adb5bd; margin-top: 10px;">这可能需要一些时间，请耐心等待</div>
      </div>
    </div>
  `;

  try {
    const response = await fetch(`${API_BASE}/memoir/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: appState.userId,
        interviewId: appState.interviewId,
        chapterNumber,
        targetWords: chapter.estimatedWords,
      }),
    });

    const data = await response.json();
    renderChapterContent(data.chapter);
    statusEl.textContent = `第 ${chapterNumber} 章撰写完成`;
    toast.success('撰写完成', `第 ${chapterNumber} 章已生成！`);
  } catch (error) {
    console.error('Failed to write chapter:', error);
    chapterContent.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
        <div style="font-size: 18px; color: #dc3545;">撰写失败</div>
        <div style="font-size: 14px; color: #6c757d; margin-top: 10px;">请稍后再试</div>
      </div>
    `;
    statusEl.textContent = '错误';
    toast.error('撰写失败', '生成章节内容失败，请稍后再试。');
  }
}

function renderChapterContent(chapter) {
  const chapterContent = document.getElementById('chapterContent');

  chapterContent.innerHTML = `
    <div class="chapter-content-header">
      <div class="chapter-content-title">第 ${chapter.chapterNumber} 章：${chapter.title}</div>
      <div class="chapter-content-meta">
        时间跨度：${chapter.periodCovered.start} - ${chapter.periodCovered.end} |
        字数：${chapter.wordCount}
      </div>
    </div>
    <div class="chapter-text">
      ${chapter.content.split('\n\n').map(p => `<p>${p}</p>`).join('')}
    </div>
  `;
}

// ============================================
// Chapter Module
// ============================================

let currentPage = 1;
let chaptersPerPage = 9;
let totalChapters = 0;
let allChapters = [];

async function loadChapterList(page = 1) {
  if (!appState.userId) return;

  currentPage = page;

  try {
    showPanelLoading('chapter');

    const response = await fetch(
      `${API_BASE}/chapters?userId=${appState.userId}&page=${page}&limit=${chaptersPerPage}`
    );
    const data = await response.json();

    hidePanelLoading('chapter');

    if (data.chapters && data.chapters.length > 0) {
      allChapters = data.chapters;
      totalChapters = data.total || data.chapters.length;
      renderChapterList(data.chapters, data.page, data.totalPages || 1);
    } else {
      renderChapterListEmpty();
    }
  } catch (error) {
    hidePanelLoading('chapter');
    console.error('Failed to load chapters:', error);
    renderChapterListEmpty();
  }
}

function renderChapterList(chapters, page = 1, totalPages = 1) {
  const chapterGrid = document.getElementById('chapterGrid');
  const chapterListContainer = chapterGrid.closest('.chapter-list-container');

  chapterGrid.innerHTML = chapters.map((chapter, index) => `
    <div class="chapter-card" data-chapter-id="${chapter.chapterId}">
      <div class="chapter-card-header">
        <span class="chapter-card-number">第 ${chapter.order || index + 1} 章</span>
        <span class="chapter-card-status ${chapter.status}">${getStatusLabel(chapter.status)}</span>
      </div>
      <div class="chapter-card-title">${chapter.title}</div>
      <div class="chapter-card-preview">${getChapterPreview(chapter.content)}</div>
      <div class="chapter-card-meta">
        <span>📝 ${chapter.wordCount || 0} 字</span>
        <span>📅 ${formatDate(chapter.updatedAt)}</span>
      </div>
    </div>
  `).join('');

  chapterGrid.querySelectorAll('.chapter-card').forEach(card => {
    card.addEventListener('click', () => {
      const chapterId = card.dataset.chapterId;
      showChapterDetail(chapterId);
    });
  });

  let paginationContainer = chapterListContainer.querySelector('.pagination');
  if (!paginationContainer && totalPages > 1) {
    paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';
    chapterListContainer.appendChild(paginationContainer);
  }

  if (totalPages > 1 && paginationContainer) {
    renderPagination(paginationContainer, page, totalPages);
  }
}

function renderPagination(container, currentPage, totalPages) {
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  let html = `
    <span class="pagination-info">
      第 ${currentPage} / ${totalPages} 页 (共 ${totalChapters} 个章节)
    </span>
    <button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
      上一页
    </button>
  `;

  if (startPage > 1) {
    html += `<button data-page="1">1</button>`;
    if (startPage > 2) {
      html += `<span class="page-ellipsis">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span class="page-ellipsis">...</span>`;
    }
    html += `<button data-page="${totalPages}">${totalPages}</button>`;
  }

  html += `
    <button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
      下一页
    </button>
  `;

  container.innerHTML = html;

  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page);
      loadChapterList(page);
    });
  });
}

function renderChapterListEmpty() {
  const chapterGrid = document.getElementById('chapterGrid');
  chapterGrid.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <div class="icon">📖</div>
      <div class="text">回忆录章节尚未撰写</div>
      <div class="hint">请先生成大纲，然后选择章节进行撰写</div>
    </div>
  `;
}

async function showChapterDetail(chapterId) {
  try {
    const response = await fetch(`${API_BASE}/chapters/${chapterId}?userId=${appState.userId}`);
    const chapter = await response.json();

    const chapterContent = document.getElementById('chapterContent');

    chapterContent.innerHTML = `
      <div class="chapter-detail-view">
        <div class="chapter-detail-header">
          <div class="chapter-detail-title">${chapter.title}</div>
          <div class="chapter-detail-meta">
            <span>📝 ${chapter.wordCount || 0} 字</span>
            <span>📅 ${formatDate(chapter.updatedAt)}</span>
            <span>🏷️ ${getTypeLabel(chapter.type)}</span>
          </div>
        </div>
        <div class="chapter-detail-toolbar">
          <button class="back-btn" id="backToListBtn">← 返回列表</button>
          <button class="edit-btn" data-export="markdown">📄 导出 Markdown</button>
          <button class="export-btn" data-export="pdf">📕 导出 PDF</button>
        </div>
        <div class="chapter-text">
          ${formatChapterContent(chapter.content)}
        </div>
      </div>
    `;

    document.getElementById('backToListBtn').addEventListener('click', () => {
      loadChapterList();
    });

    chapterContent.querySelectorAll('[data-export]').forEach(btn => {
      btn.addEventListener('click', () => {
        const format = btn.dataset.export;
        exportChapter(chapterId, format);
      });
    });
  } catch (error) {
    console.error('Failed to load chapter detail:', error);
    toast.error('加载失败', '加载章节详情失败');
  }
}

async function exportChapter(chapterId, format) {
  try {
    const response = await fetch(`${API_BASE}/chapters/${chapterId}/export/${format}?userId=${appState.userId}`);

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chapter-${chapterId}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    statusEl.textContent = `章节已导出为 ${format.toUpperCase()}`;
    toast.success('导出成功', `章节已导出为 ${format.toUpperCase()}`);
  } catch (error) {
    console.error('Failed to export chapter:', error);
    toast.error('导出失败', '导出失败，请稍后再试');
  }
}

async function exportAllChapters() {
  if (!appState.userId || !appState.memoirOutline) {
    toast.warning('无法导出', '请先完成采访和大纲生成');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/chapters?userId=${appState.userId}`);
    const data = await response.json();

    if (!data.chapters || data.chapters.length === 0) {
      toast.warning('无法导出', '没有可导出的章节');
      return;
    }

    const memoirId = data.chapters[0].memoirId;
    const exportResponse = await fetch(`${API_BASE}/memoirs/${memoirId}/export/pdf?userId=${appState.userId}`);

    if (!exportResponse.ok) {
      throw new Error('Export failed');
    }

    const blob = await exportResponse.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoir-${memoirId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    statusEl.textContent = '回忆录已导出为 PDF';
    toast.success('导出成功', '回忆录已导出为 PDF');
  } catch (error) {
    console.error('Failed to export all chapters:', error);
    toast.error('导出失败', '导出失败，请稍后再试');
  }
}

window.exportChapter = exportChapter;

// ============================================
// Search Module
// ============================================

async function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const query = searchInput.value.trim();

  if (!query) {
    searchResults.innerHTML = `
      <div class="search-empty">
        <div class="icon">🔍</div>
        <div class="text">输入关键词开始搜索</div>
      </div>
    `;
    return;
  }

  if (!appState.userId) {
    searchResults.innerHTML = `
      <div class="search-empty">
        <div class="icon">🔐</div>
        <div class="text">请先登录</div>
      </div>
    `;
    return;
  }

  searchResults.innerHTML = `
    <div class="search-loading">正在搜索...</div>
  `;

  try {
    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: appState.userId,
        query: query,
        limit: 20,
      }),
    });

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      searchResults.innerHTML = data.results.map(result => `
        <div class="search-result-item" data-chapter-id="${result.chapter_id}">
          <div class="search-result-header">
            <div class="search-result-title">${escapeHtml(result.title)}</div>
            <span class="search-result-type">${getTypeLabel(result.type)}</span>
          </div>
          <div class="search-result-content">${highlightSearchTerms(escapeHtml(result.content), query)}</div>
          <div class="search-result-meta">
            <span>📚 ${escapeHtml(result.status)}</span>
            <span>📊 BM25: ${result.bm25?.toFixed(2) || 'N/A'}</span>
          </div>
        </div>
      `).join('');

      document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const chapterId = item.dataset.chapterId;
          switchToPanel('chapter');
          showChapterDetail(chapterId);
        });
      });
    } else {
      searchResults.innerHTML = `
        <div class="search-no-results">
          <div class="icon">😕</div>
          <div class="text">未找到匹配的结果</div>
          <div class="hint">尝试使用不同的关键词</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Search failed:', error);
    searchResults.innerHTML = `
      <div class="search-empty">
        <div class="icon">❌</div>
        <div class="text">搜索失败，请稍后重试</div>
      </div>
    `;
  }
}

// ============================================
// User Session Management
// ============================================

async function handleReturningUser() {
  const identifier = document.getElementById('returningInput').value.trim();
  if (!identifier) {
    toast.warning('输入错误', '请输入手机号、邮箱或用户名');
    return;
  }

  const loadUserDataBtn = document.getElementById('loadUserDataBtn');
  loadUserDataBtn.disabled = true;
  loadUserDataBtn.textContent = '正在查找...';
  statusEl.textContent = '正在查找你的数据...';

  try {
    // Try both old and new encoding schemes for backward compatibility
    const newEncodedId = encodeIdentifier(identifier);
    const oldEncodedId = identifier.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const possibleUserIds = [
      `user_${newEncodedId}`,
      `user_${oldEncodedId}`,
      'user_user____'  // Fallback to default user for backward compatibility
    ];

    // Remove duplicates
    const uniqueUserIds = [...new Set(possibleUserIds)];

    let bestInterview = null;
    let bestInterviewData = null;
    let maxAnswers = 0;
    let foundUserId = null;

    // Try each userId and find the interview with most answers
    for (const userId of uniqueUserIds) {
      try {
        const response = await fetch(`${API_BASE}/user/${userId}/interviews`);
        const data = await response.json();

        if (data.interviews && data.interviews.length > 0) {
          // Check interviews and find the one with most answers
          for (const interview of data.interviews.slice(0, 5)) {
            try {
              const interviewRes = await fetch(`${API_BASE}/interview/${interview.interviewId}`);
              const interviewData = await interviewRes.json();
              const answersCount = interviewData.answersCount || interviewData.answers?.length || 0;

              if (answersCount > maxAnswers) {
                maxAnswers = answersCount;
                bestInterview = interview;
                bestInterviewData = interviewData;
                foundUserId = userId;
              }
            } catch (e) {
              console.warn('Failed to load interview:', interview.interviewId, e);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load user:', userId, e);
      }
    }

    if (!bestInterview) {
      toast.error('加载失败', '未找到你的数据，请检查输入或选择"我是新用户"创建新档案');
      return;
    }

    const userId = foundUserId;
    appState.userId = userId;
    appState.identifier = identifier;
    appState.interviewId = bestInterview.interviewId;
    appState.currentPhase = bestInterview.currentPhase;

    localStorage.setItem('memoiros_userId', userId);
    localStorage.setItem('memoiros_interviewId', appState.interviewId);
    localStorage.setItem('memoiros_identifier', identifier);

    // Display the best interview data
    if (bestInterviewData.answers && bestInterviewData.answers.length > 0) {
      bestInterviewData.answers.forEach(answer => {
        addMessage(answer.answer, true);
      });

      appState.answeredCount = bestInterviewData.answers.length;
      answeredCountEl.textContent = appState.answeredCount;
    }

    statusEl.textContent = `欢迎回来！已恢复 ${bestInterviewData.answersCount || 0} 条回答`;

    document.getElementById('identityModal').classList.remove('active');
    document.getElementById('userInfoBar').style.display = 'block';
    document.getElementById('currentUserName').textContent = identifier;
  } catch (error) {
    console.error('Failed to load user:', error);
    toast.error('加载失败', '加载数据失败，请重试');
    statusEl.textContent = '错误';
  } finally {
    loadUserDataBtn.disabled = false;
    loadUserDataBtn.textContent = '加载我的数据';
  }
}

async function handleNewUser() {
  const identifier = document.getElementById('newUserInput').value.trim();
  if (!identifier) {
    toast.warning('输入错误', '请输入手机号、邮箱或用户名');
    return;
  }

  const createNewUserBtn = document.getElementById('createNewUserBtn');
  createNewUserBtn.disabled = true;
  createNewUserBtn.textContent = '正在创建...';
  statusEl.textContent = '正在创建新档案...';

  try {
    const encodedId = encodeIdentifier(identifier);
    const oldEncodedId = identifier.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Check both old and new encoding for existing data
    const possibleUserIds = [
      `user_${encodedId}`,
      `user_${oldEncodedId}`
    ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    let hasExistingData = false;
    for (const checkUserId of possibleUserIds) {
      try {
        const checkResponse = await fetch(`${API_BASE}/user/${checkUserId}/interviews`);
        const checkData = await checkResponse.json();

        if (checkData.interviews && checkData.interviews.length > 0) {
          // Check if any interview has answers
          for (const interview of checkData.interviews.slice(0, 3)) {
            try {
              const intRes = await fetch(`${API_BASE}/interview/${interview.interviewId}`);
              const intData = await intRes.json();
              if (intData.answersCount > 0) {
                hasExistingData = true;
                break;
              }
            } catch (e) {
              // Ignore errors
            }
          }
        }
        if (hasExistingData) break;
      } catch (e) {
        // Continue checking other userId
      }
    }

    if (hasExistingData) {
      toast.warning('用户已存在',
        `检测到"${identifier}"已有采访记录。请选择"我是老用户"来恢复数据，或使用不同的名字创建新档案。`);
      statusEl.textContent = '用户名已存在';
      return;
    }

    // Create new interview with new encoding
    const userId = `user_${encodedId}`;
    const response = await fetch(`${API_BASE}/interview/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    appState.userId = userId;
    appState.identifier = identifier;
    appState.interviewId = data.interviewId;
    appState.currentPhase = data.phase;

    localStorage.setItem('memoiros_userId', userId);
    localStorage.setItem('memoiros_interviewId', appState.interviewId);
    localStorage.setItem('memoiros_identifier', identifier);

    statusEl.textContent = '准备就绪，开始采访吧！';

    document.getElementById('identityModal').classList.remove('active');
    document.getElementById('userInfoBar').style.display = 'block';
    document.getElementById('currentUserName').textContent = identifier;
  } catch (error) {
    console.error('Failed to create user:', error);
    toast.error('创建失败', '创建档案失败，请重试');
    statusEl.textContent = '错误';
  } finally {
    createNewUserBtn.disabled = false;
    createNewUserBtn.textContent = '创建新档案';
  }
}

function switchUser() {
  localStorage.removeItem('memoiros_userId');
  localStorage.removeItem('memoiros_interviewId');
  localStorage.removeItem('memoiros_identifier');

  appState.userId = null;
  appState.interviewId = null;
  appState.identifier = null;
  appState.answeredCount = 0;
  appState.userProfile = null;
  appState.memoirOutline = null;

  document.getElementById('messages').innerHTML = `
    <div class="message agent">
      <div class="avatar agent">🤖</div>
      <div class="message-content">
        你好！我是 MemoirOS 的采访助手。我会通过一系列问题，帮助你回忆和整理人生故事，最终生成一本属于你的回忆录。

        让我们从简单的问题开始吧！你能介绍一下你自己吗？比如你是在哪里出生的，哪一年出生的？
      </div>
    </div>
    <div class="typing-indicator" id="typing">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  answeredCountEl.textContent = '0';
  appState.currentPhase = 'warmup';
  document.getElementById('userInfoBar').style.display = 'none';

  document.getElementById('profileContent').innerHTML = `
    <div class="empty-state">
      <div class="icon">👤</div>
      <div class="text">用户画像尚未生成</div>
      <div class="hint">请先完成采访，然后点击下方按钮生成用户画像</div>
    </div>
  `;
  document.getElementById('outlineContent').innerHTML = `
    <div class="empty-state">
      <div class="icon">📋</div>
      <div class="text">回忆录大纲尚未生成</div>
      <div class="hint">请先生成用户画像，然后点击下方按钮生成大纲</div>
    </div>
  `;
  document.getElementById('chapterContent').innerHTML = `
    <div class="chapter-list-container">
      <div class="chapter-list-header">
        <div class="chapter-list-title">我的章节</div>
        <div class="chapter-list-actions">
          <button class="btn-small" id="refreshChaptersBtn">🔄 刷新</button>
          <button class="btn-small export-btn" id="exportAllBtn">📥 导出全部</button>
        </div>
      </div>
      <div class="chapter-grid" id="chapterGrid">
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="icon">📖</div>
          <div class="text">回忆录章节尚未撰写</div>
          <div class="hint">请先生成大纲，然后选择章节进行撰写</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('returningUserBtn').parentElement.style.display = 'flex';
  document.getElementById('returningUserForm').style.display = 'none';
  document.getElementById('newUserForm').style.display = 'none';
  document.getElementById('returningInput').value = '';
  document.getElementById('newUserInput').value = '';

  document.getElementById('identityModal').classList.add('active');

  // Re-bind chapter buttons
  document.getElementById('refreshChaptersBtn').addEventListener('click', loadChapterList);
  document.getElementById('exportAllBtn').addEventListener('click', exportAllChapters);
}

// ============================================
// Model Info
// ============================================

async function loadModelInfo() {
  try {
    const response = await fetch('/api/model-info');
    const data = await response.json();
    if (data.provider && data.model) {
      const providerNames = {
        'llm-hub': 'LLM Hub',
        'zhipu': '智谱 AI',
        'ollama': 'Ollama',
        'aliyun': '阿里云灵码'
      };
      const providerName = providerNames[data.provider] || data.provider;
      modelInfoEl.textContent = `${providerName} - ${data.model}`;
    } else {
      modelInfoEl.textContent = '未知模型';
    }
  } catch (error) {
    console.error('Failed to load model info:', error);
    modelInfoEl.textContent = '获取模型信息失败';
  }
}

// ============================================
// Panel Navigation
// ============================================

function setupPanelNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const panel = item.dataset.panel;

      if (panel === 'chapter' && !appState.memoirOutline) {
        toast.warning('访问受限', '请先生成回忆录大纲！');
        return;
      }
      if (panel === 'outline' && !appState.userProfile) {
        toast.warning('访问受限', '请先生成用户画像！');
        return;
      }
      if (panel === 'profile' && appState.answeredCount === 0) {
        toast.warning('访问受限', '请先完成一些采访问题！');
        return;
      }

      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${panel}`).classList.add('active');

      appState.currentPanel = panel;
      saveProgress();

      // Trigger panel-show event for modules that need it
      document.dispatchEvent(new CustomEvent('panel-show', { detail: { panel } }));

      if (panel === 'chapter') {
        loadChapterList();
      }
    });
  });
}

// ============================================
// Setup Event Listeners
// ============================================

function setupEventListeners() {
  // Identity modal events
  document.getElementById('returningUserBtn').addEventListener('click', () => {
    document.getElementById('returningUserBtn').parentElement.style.display = 'none';
    document.getElementById('returningUserForm').style.display = 'block';
    document.getElementById('returningInput').focus();
  });

  document.getElementById('newUserBtn').addEventListener('click', () => {
    document.getElementById('newUserBtn').parentElement.style.display = 'none';
    document.getElementById('newUserForm').style.display = 'block';
    document.getElementById('newUserInput').focus();
  });

  document.getElementById('backToChoiceBtn').addEventListener('click', () => {
    document.getElementById('returningUserForm').style.display = 'none';
    document.getElementById('returningUserBtn').parentElement.style.display = 'flex';
  });

  document.getElementById('backToChoiceBtn2').addEventListener('click', () => {
    document.getElementById('newUserForm').style.display = 'none';
    document.getElementById('newUserBtn').parentElement.style.display = 'flex';
  });

  document.getElementById('loadUserDataBtn').addEventListener('click', handleReturningUser);
  document.getElementById('createNewUserBtn').addEventListener('click', handleNewUser);

  document.getElementById('returningInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleReturningUser();
    }
  });

  document.getElementById('newUserInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleNewUser();
    }
  });

  document.getElementById('switchUserBtn').addEventListener('click', switchUser);

  // Interview events
  document.getElementById('sendBtn').addEventListener('click', sendMessage);

  document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Toggle timeline
  document.getElementById('toggleTimeline').addEventListener('click', () => {
    document.getElementById('timelinePreview').classList.toggle('visible');
  });

  // Profile & Outline buttons
  document.getElementById('generateProfileBtn').addEventListener('click', generateProfile);
  document.getElementById('generateOutlineBtn').addEventListener('click', generateOutline);

  // Chapter list buttons
  document.getElementById('refreshChaptersBtn').addEventListener('click', loadChapterList);
  document.getElementById('exportAllBtn').addEventListener('click', exportAllChapters);

  // Search events
  document.getElementById('searchBtn').addEventListener('click', performSearch);
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
}

// ============================================
// Auto-save Setup
// ============================================

function setupAutoSave() {
  const userInput = document.getElementById('userInput');

  userInput.addEventListener('input', () => {
    autoSave.schedule(() => {
      saveDraft(userInput.value);
    });
  });

  setInterval(() => {
    saveProgress();
  }, 30000);
}

// ============================================
// Application Initialization
// ============================================

async function initApp() {
  const savedUserId = localStorage.getItem('memoiros_userId');
  const savedInterviewId = localStorage.getItem('memoiros_interviewId');
  const savedIdentifier = localStorage.getItem('memoiros_identifier');

  if (savedUserId && savedInterviewId) {
    appState.userId = savedUserId;
    appState.identifier = savedIdentifier;
    appState.interviewId = savedInterviewId;

    try {
      const response = await apiRequest(`/user/${savedUserId}/interviews`);
      if (response.interviews && response.interviews.length > 0) {
        const latestInterview = response.interviews[0];
        if (latestInterview.interviewId === appState.interviewId) {
          appState.currentPhase = latestInterview.phase;
          appState.answeredCount = latestInterview.answers?.length || 0;

          latestInterview.answers?.forEach(answer => {
            addMessage(answer.answer, true);
          });

          answeredCountEl.textContent = appState.answeredCount;

          document.getElementById('userInfoBar').style.display = 'block';
          document.getElementById('currentUserName').textContent = savedIdentifier || appState.userId;

          const draft = loadDraft();
          if (draft) {
            document.getElementById('userInput').value = draft;
            toast.info('草稿已恢复', '你之前的输入已恢复');
          }

          const progress = loadProgress();
          if (progress) {
            setTimeout(() => {
              const panelItem = document.querySelector(`[data-panel="${progress.currentPanel}"]`);
              if (panelItem) {
                panelItem.click();
              }
            }, 500);
          }

          statusEl.textContent = '欢迎回来！';
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to restore session:', e);
    }
  }

  document.getElementById('identityModal').classList.add('active');
}

// ============================================
// Bootstrap
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  setupPanelNavigation();
  setupEventListeners();
  setupAutoSave();
  loadModelInfo();
  initApp();

  // Initialize service status panel
  if (typeof initServicePanel === 'function') {
    initServicePanel();
  }
});
