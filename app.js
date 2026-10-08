const STORAGE_KEY = 'clarity-tasks-v1';
const THEME_KEY = 'clarity-theme-v1';
const SETTINGS_KEY = 'clarity-settings-v1';
const quotes = [
  ['Almost everything will work again if you unplug it for a few minutes — including you.', '— Anne Lamott'],
  ['Start where you are. Use what you have. Do what you can.', '— Arthur Ashe'],
  ['The secret of getting ahead is getting started.', '— Mark Twain'],
  ['A little progress each day adds up to big results.', '— Satya Nani'],
  ['You do not have to see the whole staircase. Just take the first step.', '— Martin Luther King Jr.']
];

let tasks = [];
let activeView = 'today';
let calendarViewMode = 'week'; // Default to Week view on open
let calendarCursor = new Date();
let settings = { theme: 'midnight', fontStyle: 'editorial', inspirationText: '', inspirationImage: '' };
let draftTheme = 'midnight';
let draftFont = 'editorial';
let draftImage = '';

const $ = (selector, context = document) => context.querySelector(selector);
const pad = (num) => String(num).padStart(2, '0');
const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const todayKey = () => toDateKey(new Date());
const parseKey = (key) => { const [y,m,d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2));

function getStore() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise(resolve => chrome.storage.local.get([STORAGE_KEY, THEME_KEY, SETTINGS_KEY], data => resolve(data || {})));
  }
  return Promise.resolve({
    [STORAGE_KEY]: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
    [THEME_KEY]: localStorage.getItem(THEME_KEY),
    [SETTINGS_KEY]: JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
  });
}

function setStore(data) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise(resolve => chrome.storage.local.set(data, resolve));
  }
  Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)));
  return Promise.resolve();
}

function taskOccursOn(task, dateKey) {
  if (!task.date) return false;
  if (task.repeat === 'none' || !task.repeat) return task.date === dateKey;
  const start = parseKey(task.date), candidate = parseKey(dateKey);
  if (candidate < start) return false;
  if (task.repeat === 'daily') return true;
  if (task.repeat === 'weekly') return start.getDay() === candidate.getDay();
  return start.getDate() === candidate.getDate();
}

function dueText(task) {
  if (!task.date) return task.repeat && task.repeat !== 'none' ? `Repeats ${task.repeat}` : 'No deadline';
  const dateObj = parseKey(task.date), today = parseKey(todayKey());
  const diff = Math.round((dateObj - today) / 86400000);
  let label = diff === 0 ? 'Due today' : diff === 1 ? 'Due tomorrow' : diff === -1 ? 'Overdue (yesterday)' : diff < -1 ? `Overdue (${dateObj.toLocaleDateString(undefined, {month:'short', day:'numeric'})})` : `Due ${dateObj.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'})}`;
  if (task.repeat && task.repeat !== 'none') label += ` · ${task.repeat}`;
  if (task.time) {
    const [hours, mins] = task.time.split(':');
    const d = new Date(); d.setHours(+hours, +mins);
    label += ` at ${d.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}`;
  }
  return label;
}

function currentTasks() {
  const now = new Date();
  const today = parseKey(todayKey());
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);

  if (activeView === 'today') {
    // Today view: ONLY tasks due today or overdue
    return tasks.filter(task => {
      if (!task.date) return false; // Undated tasks hidden from Today view
      const dateObj = parseKey(task.date);
      if (taskOccursOn(task, todayKey())) return true; // Due today
      if (!task.completed && dateObj < today) return true; // Overdue
      return false;
    });
  }

  if (activeView === 'upcoming') {
    // Upcoming view: tasks due in next 7 days + undated tasks (no deadline)
    return tasks.filter(task => {
      if (!task.date) return true;
      const dateObj = parseKey(task.date);
      return dateObj >= today && dateObj <= nextWeek;
    });
  }

  // All view: every task
  return [...tasks];
}

function priorityRank(task) {
  const p = task.priority || 'medium';
  if (p === 'high') return 3; // Deep focus (red) - top!
  if (p === 'medium') return 2; // Steady (orange)
  return 1; // Light (green)
}

function sortTasks(items) {
  return [...items].sort((a,b) => 
    Number(a.completed) - Number(b.completed) || 
    priorityRank(b) - priorityRank(a) || 
    Number(b.focus) - Number(a.focus) || 
    (a.date || '9999').localeCompare(b.date || '9999') || 
    (a.time || '99').localeCompare(b.time || '99')
  );
}

function computeStreak() {
  const completedDates = new Set();
  tasks.forEach(t => {
    if (t.completed) {
      if (t.completedAt) completedDates.add(toDateKey(new Date(t.completedAt)));
      else if (t.date) completedDates.add(t.date);
      else completedDates.add(todayKey());
    }
  });

  let streak = 0;
  let curr = new Date();
  let currKey = toDateKey(curr);

  if (completedDates.has(currKey)) {
    streak++;
    curr.setDate(curr.getDate() - 1);
  } else {
    curr.setDate(curr.getDate() - 1);
    currKey = toDateKey(curr);
    if (!completedDates.has(currKey)) return 0;
  }

  while (completedDates.has(toDateKey(curr))) {
    streak++;
    curr.setDate(curr.getDate() - 1);
  }

  return streak;
}

function renderTasks() {
  const list = $('#taskList'), empty = $('#emptyState'), items = sortTasks(currentTasks());
  const headings = {
    today: ['Today’s plan', 'Taking one step at a time.'],
    upcoming: ['Coming up', 'Just be consistent, Keep moving forward'],
    all: ['Everything', 'All the tasks laid out view']
  };
  if ($('#taskHeading')) $('#taskHeading').textContent = headings[activeView][0];
  if ($('#taskSubheading')) $('#taskSubheading').textContent = headings[activeView][1];
  list.innerHTML = '';

  items.forEach(task => {
    const template = $('#taskTemplate');
    if (!template) return;
    const el = template.content.firstElementChild.cloneNode(true);
    el.dataset.id = task.id;
    el.classList.toggle('completed', !!task.completed);
    
    const titleEl = el.querySelector('.task-title');
    if (titleEl) titleEl.textContent = task.title;
    
    const metaEl = el.querySelector('.task-meta');
    if (metaEl) metaEl.textContent = dueText(task);
    
    const focusPill = el.querySelector('.focus-pill');
    if (focusPill) focusPill.classList.toggle('hidden', !task.focus);

    // Colored Energy Priority Pill (Green: Light, Orange: Steady, Red: Deep focus)
    const priorityPill = el.querySelector('.priority-pill');
    if (priorityPill) {
      const p = task.priority || 'medium';
      priorityPill.className = `priority-pill priority-${p}`;
      priorityPill.textContent = p === 'high' ? 'Deep focus' : p === 'low' ? 'Light' : 'Steady';
    }
    
    const checkBtn = el.querySelector('.check-button');
    if (checkBtn) checkBtn.addEventListener('click', () => toggleComplete(task.id));
    
    const starBtn = el.querySelector('.star-button');
    if (starBtn) {
      starBtn.textContent = task.focus ? '★' : '☆';
      starBtn.addEventListener('click', () => setFocus(task.id));
    }
    
    const moreBtn = el.querySelector('.more-button');
    if (moreBtn) moreBtn.addEventListener('click', () => deleteTask(task.id));
    
    list.append(el);
  });

  list.classList.toggle('hidden', !items.length);
  empty.classList.toggle('hidden', !!items.length);
  const completed = items.filter(t => t.completed).length;
  const total = items.length;
  if ($('#progressLabel')) $('#progressLabel').textContent = `${completed} of ${total} complete`;
  if ($('#progressBar')) $('#progressBar').style.width = `${total ? completed / total * 100 : 0}%`;
  if ($('#progressRow')) $('#progressRow').classList.toggle('hidden', !items.length);
  if ($('#clearCompleted')) $('#clearCompleted').classList.toggle('hidden', !tasks.some(t => t.completed));
  if ($('#clearAllPlanner')) $('#clearAllPlanner').classList.toggle('hidden', !tasks.length);
}

function renderFocus() {
  const task = tasks.find(item => item.focus && !item.completed);
  if ($('#focusEmpty')) $('#focusEmpty').classList.toggle('hidden', !!task);
  if ($('#focusTask')) $('#focusTask').classList.toggle('hidden', !task);
  if (task && $('#focusTask')) $('#focusTask').textContent = task.title;
}

function renderStreak() {
  const streak = computeStreak();
  const el = $('#streakCount');
  if (el) el.textContent = streak;
}

function renderCalendar() {
  const grid = $('#calendarGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const monthBtn = $('#calViewMonth');
  const weekBtn = $('#calViewWeek');
  if (monthBtn) monthBtn.classList.toggle('active', calendarViewMode === 'month');
  if (weekBtn) weekBtn.classList.toggle('active', calendarViewMode === 'week');

  if (calendarViewMode === 'month') {
    const year = calendarCursor.getFullYear(), month = calendarCursor.getMonth();
    if ($('#calendarMonth')) $('#calendarMonth').textContent = calendarCursor.toLocaleString(undefined, {month:'long', year:'numeric'});
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const prevTotal = new Date(year, month, 0).getDate();
    
    for (let cell = 0; cell < 42; cell++) {
      let date, muted = false;
      if (cell < firstDay) {
        date = new Date(year, month - 1, prevTotal - firstDay + cell + 1);
        muted = true;
      } else if (cell >= firstDay + total) {
        date = new Date(year, month + 1, cell - firstDay - total + 1);
        muted = true;
      } else {
        date = new Date(year, month, cell - firstDay + 1);
      }
      const key = toDateKey(date);
      const dayTasks = tasks.filter(t => t.date && taskOccursOn(t, key) && !t.completed);
      const btn = document.createElement('button');
      btn.className = `calendar-day${muted ? ' muted' : ''}${key === todayKey() ? ' today' : ''}${dayTasks.length ? ' has-tasks' : ''}`;
      btn.textContent = date.getDate();
      btn.title = dayTasks.map(t => t.title).join('\n') || date.toLocaleDateString();
      btn.addEventListener('click', () => openDialog(key));
      grid.append(btn);
    }
  } else {
    const dayOfWeek = (calendarCursor.getDay() + 6) % 7;
    const monday = new Date(calendarCursor);
    monday.setDate(calendarCursor.getDate() - dayOfWeek);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    if ($('#calendarMonth')) $('#calendarMonth').textContent = `${monday.toLocaleString(undefined, {month:'short', day:'numeric'})} – ${sunday.toLocaleString(undefined, {month:'short', day:'numeric'})}`;

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const key = toDateKey(date);
      const dayTasks = tasks.filter(t => t.date && taskOccursOn(t, key) && !t.completed);
      const btn = document.createElement('button');
      btn.className = `calendar-day week-view-day${key === todayKey() ? ' today' : ''}${dayTasks.length ? ' has-tasks' : ''}`;
      btn.textContent = date.getDate();
      btn.title = dayTasks.map(t => t.title).join('\n') || date.toLocaleDateString();
      btn.addEventListener('click', () => openDialog(key));
      grid.append(btn);
    }
  }
}

function renderOverview() {
  const start = parseKey(todayKey()), end = new Date(start); end.setDate(start.getDate()+6);
  const count = tasks.filter(t => !t.completed && (taskOccursOn(t, todayKey()) || (t.date && parseKey(t.date) >= start && parseKey(t.date) <= end))).length;
  if ($('#weekCount')) $('#weekCount').textContent = count;
  if ($('#weekNote')) $('#weekNote').textContent = count === 0 ? 'Nothing added yet.' : count === 1 ? 'One commitment is waiting for you.' : 'Take one thoughtful step at a time.';
}

function renderAnalytics() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthName = now.toLocaleString(undefined, { month: 'long' });

  if ($('#analyticsMonthName')) $('#analyticsMonthName').textContent = monthName;

  const monthlyTasks = tasks.filter(t => {
    if (t.createdAt) {
      const createdDate = new Date(t.createdAt);
      if (createdDate.getFullYear() === currentYear && createdDate.getMonth() === currentMonth) return true;
    }
    if (t.date) {
      const [y, m] = t.date.split('-').map(Number);
      if (y === currentYear && (m - 1) === currentMonth) return true;
    }
    return false;
  });

  const total = monthlyTasks.length;
  const completed = monthlyTasks.filter(t => t.completed).length;
  const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;

  const lowCount = monthlyTasks.filter(t => (t.priority || 'medium') === 'low').length;
  const medCount = monthlyTasks.filter(t => (t.priority || 'medium') === 'medium').length;
  const highCount = monthlyTasks.filter(t => (t.priority || 'medium') === 'high').length;

  if ($('#analyticsTotalTasks')) $('#analyticsTotalTasks').textContent = total;
  if ($('#analyticsCompletedTasks')) $('#analyticsCompletedTasks').textContent = completed;
  if ($('#analyticsEfficiency')) $('#analyticsEfficiency').textContent = `${efficiency}%`;
  if ($('#analyticsEfficiencyFill')) $('#analyticsEfficiencyFill').style.width = `${efficiency}%`;

  if ($('#analyticsEnergyLow')) $('#analyticsEnergyLow').textContent = `🟢 ${lowCount} Light`;
  if ($('#analyticsEnergyMedium')) $('#analyticsEnergyMedium').textContent = `🟠 ${medCount} Steady`;
  if ($('#analyticsEnergyHigh')) $('#analyticsEnergyHigh').textContent = `🔴 ${highCount} Deep`;
}

function render() {
  renderTasks();
  renderFocus();
  renderStreak();
  renderCalendar();
  renderOverview();
  renderAnalytics();
}

async function persist() {
  await setStore({ [STORAGE_KEY]: tasks });
  render();
}

async function toggleComplete(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : null } : t);
  await persist();
}

async function setFocus(id) {
  tasks = tasks.map(t => ({...t, focus: t.id === id ? !t.focus : false}));
  await persist();
}

async function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  await persist();
}

function openDialog(date = '') {
  const form = $('#taskForm');
  if (form) form.reset();
  if ($('#taskDate')) $('#taskDate').value = date || todayKey();
  const dialog = $('#taskDialog');
  if (dialog && typeof dialog.showModal === 'function') {
    dialog.showModal();
    setTimeout(() => { if ($('#taskTitle')) $('#taskTitle').focus(); }, 80);
  }
}

function closeDialog() {
  const dialog = $('#taskDialog');
  if (dialog && typeof dialog.close === 'function') dialog.close();
}

const ALL_THEMES = ['midnight', 'emerald', 'cherry', 'ocean', 'autumn', 'rose', 'sage', 'linen'];
const ALL_FONTS = ['caveat', 'zeyada', 'abel', 'creative', 'classic'];

function applyTheme(theme) {
  ALL_THEMES.forEach(t => document.body.classList.remove(`theme-${t}`));
  document.body.classList.add(`theme-${theme}`);
}

function applyFont(font) {
  ALL_FONTS.forEach(f => document.body.classList.remove(`font-${f}`));
  document.body.classList.add(`font-${font || 'zeyada'}`);
}

function renderInspiration() {
  const quote = quotes[new Date().getDate() % quotes.length];
  const customText = settings.inspirationText?.trim();
  const image = settings.inspirationImage;
  if ($('#quoteText')) $('#quoteText').textContent = customText || quote[0];
  if ($('#quoteAuthor')) $('#quoteAuthor').textContent = customText ? '' : quote[1];
  
  const sideDisplay = $('#sideImageDisplay');
  const emptyPrompt = $('#emptyImagePrompt');
  const activeView = $('#activeImageView');
  if (sideDisplay && emptyPrompt && activeView) {
    if (image) {
      sideDisplay.src = image;
      emptyPrompt.classList.add('hidden');
      activeView.classList.remove('hidden');
    } else {
      sideDisplay.src = '';
      emptyPrompt.classList.remove('hidden');
      activeView.classList.add('hidden');
    }
  }
  if ($('#inspirationCard')) $('#inspirationCard').classList.toggle('has-image', !!image);
}

function updateThemeChoices() {
  document.querySelectorAll('.theme-choice').forEach(button => button.classList.toggle('selected', button.dataset.theme === draftTheme));
}

function updateFontChoices() {
  document.querySelectorAll('.font-choice').forEach(button => button.classList.toggle('selected', button.dataset.font === draftFont));
}

function setPreview(image) {
  if ($('#previewImage')) $('#previewImage').src = image || '';
  if ($('#imagePreview')) $('#imagePreview').classList.toggle('hidden', !image);
}

function openSettings() {
  draftTheme = settings.theme;
  draftFont = settings.fontStyle || 'zeyada';
  draftImage = settings.inspirationImage || '';
  if ($('#inspirationText')) $('#inspirationText').value = settings.inspirationText || '';
  if ($('#inspirationUpload')) $('#inspirationUpload').value = '';
  if ($('#uploadMessage')) $('#uploadMessage').textContent = '';
  setPreview(draftImage);
  updateThemeChoices();
  updateFontChoices();
  const dialog = $('#settingsDialog');
  if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
}

function closeSettings(keepChanges) {
  if (!keepChanges) {
    applyTheme(settings.theme);
    applyFont(settings.fontStyle);
  }
  const dialog = $('#settingsDialog');
  if (dialog && typeof dialog.close === 'function') dialog.close();
}

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Live synchronization between extension popup & open planner tabs
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes[STORAGE_KEY]) {
        tasks = changes[STORAGE_KEY].newValue || [];
        render();
      }
      if (changes[SETTINGS_KEY]) {
        settings = { ...settings, ...(changes[SETTINGS_KEY].newValue || {}) };
        applyTheme(settings.theme);
        applyFont(settings.fontStyle);
        renderInspiration();
        render();
      }
    }
  });
}
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    tasks = JSON.parse(e.newValue || '[]');
    render();
  } else if (e.key === SETTINGS_KEY) {
    settings = { ...settings, ...JSON.parse(e.newValue || '{}') };
    applyTheme(settings.theme);
    applyFont(settings.fontStyle);
    renderInspiration();
    render();
  }
});

async function init() {
  const data = await getStore();
  tasks = data[STORAGE_KEY] || [];
  settings = { ...settings, ...(data[SETTINGS_KEY] || {}) };
  if (!ALL_THEMES.includes(settings.theme)) settings.theme = 'midnight';
  if (!ALL_FONTS.includes(settings.fontStyle)) settings.fontStyle = 'zeyada';
  applyTheme(settings.theme);
  applyFont(settings.fontStyle);

  const now = new Date();
  if ($('#dateLabel')) $('#dateLabel').textContent = now.toLocaleDateString(undefined, {weekday:'long', month:'long', day:'numeric'});
  renderInspiration();

  document.querySelectorAll('.view-tab').forEach(btn => btn.addEventListener('click', () => {
    activeView = btn.dataset.view;
    document.querySelectorAll('.view-tab').forEach(t => t.classList.toggle('active', t === btn));
    render();
  }));

  const heroQuickAdd = $('#heroQuickAdd');
  if (heroQuickAdd) {
    heroQuickAdd.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('#heroTaskInput');
      if (!input) return;
      const title = input.value.trim();
      if (!title) return;
      const newTask = {
        id: generateId(),
        title,
        date: '',
        time: '',
        priority: 'medium',
        repeat: 'none',
        focus: false,
        completed: false,
        createdAt: Date.now(),
        completedAt: null
      };
      tasks.push(newTask);
      input.value = '';
      await persist();
    });
  }

  if ($('#openTaskModal')) $('#openTaskModal').addEventListener('click', () => openDialog());
  if ($('#heroOpenModal')) $('#heroOpenModal').addEventListener('click', () => openDialog());
  if ($('#emptyAdd')) $('#emptyAdd').addEventListener('click', () => openDialog());
  if ($('#closeTaskModal')) $('#closeTaskModal').addEventListener('click', closeDialog);
  if ($('#cancelTask')) $('#cancelTask').addEventListener('click', closeDialog);

  const taskForm = $('#taskForm');
  if (taskForm) {
    taskForm.addEventListener('submit', async event => {
      event.preventDefault();
      const fd = new FormData(event.currentTarget);
      const newTask = {
        id: generateId(),
        title: fd.get('title').trim(),
        date: fd.get('date') || '',
        time: fd.get('time') || '',
        priority: fd.get('priority'),
        repeat: fd.get('repeat'),
        focus: fd.get('focus') === 'on',
        completed: false,
        createdAt: Date.now(),
        completedAt: null
      };
      if (!newTask.title) return;
      if (newTask.focus) tasks = tasks.map(t => ({...t, focus: false}));
      tasks.push(newTask);
      closeDialog();
      await persist();
    });
  }

  if ($('#clearCompleted')) {
    $('#clearCompleted').addEventListener('click', async () => {
      tasks = tasks.filter(t => !t.completed);
      await persist();
    });
  }
  if ($('#clearAllPlanner')) {
    $('#clearAllPlanner').addEventListener('click', async () => {
      tasks = [];
      await persist();
    });
  }

  if ($('#prevMonth')) {
    $('#prevMonth').addEventListener('click', () => {
      if (calendarViewMode === 'month') {
        calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
      } else {
        calendarCursor.setDate(calendarCursor.getDate() - 7);
      }
      renderCalendar();
    });
  }
  if ($('#nextMonth')) {
    $('#nextMonth').addEventListener('click', () => {
      if (calendarViewMode === 'month') {
        calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
      } else {
        calendarCursor.setDate(calendarCursor.getDate() + 7);
      }
      renderCalendar();
    });
  }
  if ($('#calViewMonth')) {
    $('#calViewMonth').addEventListener('click', () => {
      calendarViewMode = 'month';
      renderCalendar();
    });
  }
  if ($('#calViewWeek')) {
    $('#calViewWeek').addEventListener('click', () => {
      calendarViewMode = 'week';
      renderCalendar();
    });
  }

  if ($('#themeButton')) $('#themeButton').addEventListener('click', openSettings);
  if ($('#closeSettings')) $('#closeSettings').addEventListener('click', () => closeSettings(false));
  if ($('#cancelSettings')) $('#cancelSettings').addEventListener('click', () => closeSettings(false));
  if ($('#settingsDialog')) {
    $('#settingsDialog').addEventListener('cancel', event => { event.preventDefault(); closeSettings(false); });
  }
  document.querySelectorAll('.theme-choice').forEach(button => button.addEventListener('click', () => {
    draftTheme = button.dataset.theme;
    applyTheme(draftTheme);
    updateThemeChoices();
  }));

  document.querySelectorAll('.font-choice').forEach(button => button.addEventListener('click', () => {
    draftFont = button.dataset.font;
    applyFont(draftFont);
    updateFontChoices();
  }));

  if ($('#inspirationUpload')) {
    $('#inspirationUpload').addEventListener('change', async event => {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) {
        if ($('#uploadMessage')) $('#uploadMessage').textContent = 'Please choose an image smaller than 4 MB.';
        event.target.value = '';
        return;
      }
      try {
        draftImage = await fileAsDataUrl(file);
        setPreview(draftImage);
        if ($('#uploadMessage')) $('#uploadMessage').textContent = 'Image ready to save locally.';
      } catch {
        if ($('#uploadMessage')) $('#uploadMessage').textContent = 'That image could not be read. Please try another file.';
      }
    });
  }

  if ($('#removeImage')) {
    $('#removeImage').addEventListener('click', () => {
      draftImage = '';
      if ($('#inspirationUpload')) $('#inspirationUpload').value = '';
      setPreview('');
      if ($('#uploadMessage')) $('#uploadMessage').textContent = 'Image removed. Save preferences to keep this change.';
    });
  }

  const settingsForm = $('#settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async event => {
      event.preventDefault();
      settings = {
        ...settings,
        theme: draftTheme,
        fontStyle: draftFont,
        inspirationText: $('#inspirationText').value.trim(),
        inspirationImage: draftImage
      };
      await setStore({ [SETTINGS_KEY]: settings });
      applyTheme(settings.theme);
      applyFont(settings.fontStyle);
      renderInspiration();
      closeSettings(true);
    });
  }

  if ($('#emptyImagePrompt')) {
    $('#emptyImagePrompt').addEventListener('click', () => {
      if ($('#sideCardImageInput')) $('#sideCardImageInput').click();
    });
  }

  if ($('#sideCardImageChange')) {
    $('#sideCardImageChange').addEventListener('click', () => {
      if ($('#sideCardImageInput')) $('#sideCardImageInput').click();
    });
  }

  if ($('#sideCardImageInput')) {
    $('#sideCardImageInput').addEventListener('change', async event => {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) {
        alert('Please choose an image smaller than 4 MB.');
        event.target.value = '';
        return;
      }
      try {
        const dataUrl = await fileAsDataUrl(file);
        settings = { ...settings, inspirationImage: dataUrl };
        await setStore({ [SETTINGS_KEY]: settings });
        renderInspiration();
      } catch (err) {
        console.error('Image upload failed', err);
      }
    });
  }

  if ($('#sideCardImageRemove')) {
    $('#sideCardImageRemove').addEventListener('click', async () => {
      settings = { ...settings, inspirationImage: '' };
      await setStore({ [SETTINGS_KEY]: settings });
      renderInspiration();
    });
  }

  render();
}

init();
