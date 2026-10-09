const KEY = 'clarity-tasks-v1';
const SETTINGS_KEY = 'clarity-settings-v1';
let tasks = [];
let quoteIndex = 0;
let deadlineEnabled = false;
const notes = [
  'One thing at a time.',
  'Tiny progress still counts.',
  'Make the next step kind.',
  'You can begin again here.',
  'Your biggest enemy is you — do it for the plot.'
];
const $ = selector => document.querySelector(selector);
const pad = value => String(value).padStart(2, '0');
const dateKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const today = () => dateKey(new Date());
const parse = key => { const [y,m,d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2));

function applyTheme(theme) { document.body.className = ['midnight','emerald','cherry','ocean','autumn','rose','moss','mocha'].includes(theme) ? `theme-${theme}` : 'theme-midnight'; }

function getStore() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise(resolve => chrome.storage.local.get([KEY, SETTINGS_KEY], data => resolve(data || {})));
  }
  return Promise.resolve({
    [KEY]: JSON.parse(localStorage.getItem(KEY) || '[]'),
    [SETTINGS_KEY]: JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
  });
}

function setStore(data) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve();
      });
    });
  }
  Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)));
  return Promise.resolve();
}

function format12Hour(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let hours = parseInt(hStr, 10);
  const mins = parseInt(mStr, 10);
  if (isNaN(hours) || isNaN(mins)) return timeStr;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const formattedMins = String(mins).padStart(2, '0');
  return `${hours}:${formattedMins} ${ampm}`;
}

function meta(task) {
  if (!task.date) return task.repeat && task.repeat !== 'none' ? `Repeats ${task.repeat}` : 'No deadline';
  const due = parse(task.date);
  const isToday = task.date === today();
  const isTomorrow = task.date === dateKey(new Date(Date.now() + 86400000));
  const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : due.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'});
  if (!task.time) return task.repeat && task.repeat !== 'none' ? `${dayLabel} · Repeats ${task.repeat}` : `Due ${dayLabel}`;
  return `Due ${dayLabel} at ${format12Hour(task.time)}`;
}

function dueAt(task) {
  if (!task.date) return 9999999999999;
  const due = parse(task.date);
  if (task.time) {
    const [hours, minutes] = task.time.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) due.setHours(hours, minutes, 0, 0);
  } else due.setHours(23, 30, 0, 0);
  return due.getTime();
}

function priorityRank(task) {
  const p = task.priority || 'medium';
  if (p === 'high') return 3; // Deep focus (red) - top!
  if (p === 'medium') return 2; // Steady (orange)
  return 1; // Light (green)
}

function render() {
  const visible = [...tasks].sort((a,b) => 
    Number(a.completed) - Number(b.completed) || 
    priorityRank(b) - priorityRank(a) || 
    dueAt(a) - dueAt(b) || 
    (a.title || '').localeCompare(b.title || '')
  );
  const list = $('#taskList'); list.innerHTML = '';
  
  visible.forEach(task => {
    const item = document.createElement('article'); item.className = `task${task.completed ? ' done' : ''}`;
    
    // Check completion button
    const check = document.createElement('button');
    check.className = 'check';
    check.textContent = task.completed ? '✓' : '';
    check.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
    check.addEventListener('click', () => toggle(task.id));

    // Task details
    const copy = document.createElement('div'); copy.className = 'task-copy';
    const titleSpan = document.createElement('span'); titleSpan.className = 'title'; titleSpan.textContent = task.title;
    const metaSpan = document.createElement('span'); metaSpan.className = 'meta'; metaSpan.textContent = meta(task);
    copy.append(titleSpan, metaSpan);
    item.append(check, copy);

    // Energy Priority Badge Pill (Far Right position)
    const p = task.priority || 'medium';
    const pPill = document.createElement('span');
    pPill.className = `popup-priority-pill priority-${p}`;
    pPill.textContent = p === 'high' ? 'Deep focus' : p === 'low' ? 'Light' : 'Steady';
    item.append(pPill);

    // Focus indicator
    if (task.focus && !task.completed) {
      const focus = document.createElement('span');
      focus.className = 'focus';
      focus.textContent = '✦';
      focus.title = 'Focus anchor';
      item.append(focus);
    }

    // Delete task button (explicit deletion)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-task-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.setAttribute('title', 'Delete task');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTask(task.id);
    });
    item.append(deleteBtn);

    list.append(item);
  });

  $('#empty').hidden = visible.length > 0;
  list.hidden = visible.length === 0;
  $('#progress').textContent = `${visible.filter(t => t.completed).length} / ${visible.length}`;
}

async function save(nextTasks) {
  await setStore({ [KEY]: nextTasks });
}

async function toggle(id) {
  const nextTasks = tasks.map(task => {
    if (task.id === id) {
      const nextCompleted = !task.completed;
      return {
        ...task,
        completed: nextCompleted,
        completedAt: nextCompleted ? Date.now() : null
      };
    }
    return task;
  });
  await save(nextTasks);
  tasks = nextTasks;
  render();
}

async function removeTask(id) {
  const nextTasks = tasks.filter(task => task.id !== id);
  await save(nextTasks);
  tasks = nextTasks;
  render();
}

async function add(title, date, time, priority = 'medium') {
  const newTask = {
    id: generateId(),
    title,
    date,
    time,
    priority,
    repeat: 'none',
    focus: false,
    completed: false,
    createdAt: Date.now(),
    completedAt: null
  };
  const nextTasks = [...tasks, newTask];
  await save(nextTasks);
  tasks = nextTasks;
  render();
}

function updateDeadlineFields(enabled) {
  deadlineEnabled = enabled;
  $('#deadlineFields').classList.toggle('hidden', !enabled);
  $('#deadlineToggle').textContent = enabled ? '× Remove deadline' : '+ Add deadline';
  if (enabled && !$('#taskDate').value) $('#taskDate').value = today();
}

function setStatus(message) {
  const el = $('#saveStatus');
  if (el) el.textContent = message;
}

function setNotificationStatus(message) {
  const el = $('#notificationStatus');
  if (el) el.textContent = message;
}

// Live synchronization between extension popup & full planner page
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes[KEY]) {
        tasks = changes[KEY].newValue || [];
        render();
      }
      if (changes[SETTINGS_KEY]) {
        const s = changes[SETTINGS_KEY].newValue || {};
        applyTheme(s.theme);
        if (s.inspirationText?.trim()) $('#footerNote').textContent = s.inspirationText.trim();
      }
    }
  });
}
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    tasks = JSON.parse(e.newValue || '[]');
    render();
  }
});

async function init() {
  try {
    const data = await getStore();
    tasks = data[KEY] || [];
    const settings = data[SETTINGS_KEY] || {};
    applyTheme(settings.theme);
    if (settings.inspirationText?.trim()) $('#footerNote').textContent = settings.inspirationText.trim();
  } catch (err) {
    console.error('Init error:', err);
  }

  $('#dateLabel').textContent = new Date().toLocaleDateString(undefined, {weekday:'long', month:'long', day:'numeric'});
  $('#deadlineToggle').addEventListener('click', () => updateDeadlineFields(!deadlineEnabled));

  $('#quickAdd').addEventListener('submit', async event => {
    event.preventDefault();
    const input = $('#taskTitle');
    const title = input.value.trim();
    if (!title) { setStatus('Please add a task title.'); input.focus(); return; }
    // If deadline toggle was not clicked, date is empty string (No deadline)
    const date = deadlineEnabled ? ($('#taskDate').value || today()) : '';
    const time = deadlineEnabled ? $('#taskTime').value : '';
    const priority = deadlineEnabled && $('#taskPriority') ? $('#taskPriority').value : 'medium';
    const saveButton = $('#saveTask');
    saveButton.disabled = true;
    setStatus('Saving…');
    try {
      await add(title, date, time, priority);
      input.value = '';
      if ($('#taskDate')) $('#taskDate').value = '';
      if ($('#taskTime')) $('#taskTime').value = '';
      updateDeadlineFields(false);
      setStatus(date ? (time ? 'Saved — deadline set.' : 'Saved with due date.') : 'Saved — no deadline.');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Add task error:', error);
      setStatus(`Could not save: ${error.message || 'Unknown error'}`);
    } finally {
      saveButton.disabled = false;
    }
  });

  const clearBtn = $('#clearAllTasks');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (tasks.length === 0) return;
      tasks = [];
      await save(tasks);
      render();
    });
  }

  $('#openPlanner').addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime) {
      chrome.tabs.create({url: chrome.runtime.getURL('index.html')});
    } else {
      window.open('index.html', '_blank');
    }
  });

  $('#testNotification').addEventListener('click', () => {
    setNotificationStatus('Sending test…');
    if (typeof chrome !== 'undefined' && chrome.notifications && chrome.notifications.create) {
      chrome.notifications.create(
        `clarity-test-${Date.now()}`,
        {
          type: 'basic',
          iconUrl: typeof chrome.runtime !== 'undefined' && chrome.runtime.getURL ? chrome.runtime.getURL('icon.png') : 'icon.png',
          title: 'Clarity reminders are on',
          message: 'This is how a task reminder will appear.',
          priority: 2
        },
        notificationId => {
          const error = chrome.runtime && chrome.runtime.lastError;
          if (error) {
            setNotificationStatus(`Notification error: ${error.message}`);
          } else {
            setNotificationStatus('Test sent!');
          }
        }
      );
    } else if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Clarity reminders are on', { body: 'This is how a task reminder will appear.', icon: 'icon.png' });
          setNotificationStatus('Test notification sent.');
        } else {
          setNotificationStatus('Notification permission denied.');
        }
      });
    } else {
      setNotificationStatus('Notifications not supported.');
    }
  });

  $('#refreshQuote').addEventListener('click', () => {
    quoteIndex = (quoteIndex + 1) % notes.length;
    $('#footerNote').textContent = notes[quoteIndex];
  });

  render();
}

init();
