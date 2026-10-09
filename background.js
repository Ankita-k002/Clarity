const TASK_KEY = 'clarity-tasks-v1';
const ALARM_PREFIX = 'clarity-reminder|';
const REFRESH_ALARM = `${ALARM_PREFIX}refresh`;

const pad = value => String(value).padStart(2, '0');
const keyFor = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseKey = key => { const [year, month, day] = key.split('-').map(Number); return new Date(year, month - 1, day); };

function occursOn(task, key) {
  if (!task.date) return key === keyFor(new Date());
  if (task.repeat === 'none') return task.date === key;
  const first = parseKey(task.date), candidate = parseKey(key);
  if (candidate < first) return false;
  if (task.repeat === 'daily') return true;
  if (task.repeat === 'weekly') return first.getDay() === candidate.getDay();
  return first.getDate() === candidate.getDate();
}

function createAlarm(name, when) {
  if (when > Date.now()) chrome.alarms.create(name, { when });
}

function scheduleTimed(task, now) {
  if (!task.date || !task.time) return;
  const [hours, minutes] = task.time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return;
  for (let offset = 0; offset <= 370; offset++) {
    const occurrence = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    if (!occursOn(task, keyFor(occurrence))) continue;
    const deadline = new Date(occurrence.getFullYear(), occurrence.getMonth(), occurrence.getDate(), hours, minutes).getTime();
    const leadTime = deadline - now.getTime();
    if (leadTime < -24 * 60 * 60 * 1000) continue;
    
    // 1. 1 hour before deadline
    if (leadTime > 60 * 60 * 1000) {
      createAlarm(`${ALARM_PREFIX}${task.id}|timed-60`, deadline - 60 * 60 * 1000);
    }
    // 2. 10 minutes before deadline
    if (leadTime > 10 * 60 * 1000) {
      createAlarm(`${ALARM_PREFIX}${task.id}|timed-10`, deadline - 10 * 60 * 1000);
    }
    // 3. Exactly when deadline passes
    if (leadTime > 0) {
      createAlarm(`${ALARM_PREFIX}${task.id}|timed-passed`, deadline);
    }
    return;
  }
}

function scheduleFlexible(task, now) {
  if (task.time || !occursOn(task, keyFor(now))) return;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 30).getTime();
  const start = Math.max(now.getTime(), Number(task.createdAt) || now.getTime());
  const remaining = end - start;
  if (remaining < 10 * 60 * 1000) return;
  const count = remaining >= 4 * 60 * 60 * 1000 ? 4 : remaining >= 2 * 60 * 60 * 1000 ? 3 : 2;
  for (let index = 1; index <= count; index++) {
    createAlarm(`${ALARM_PREFIX}${task.id}|gentle-${index}`, start + (remaining * index) / (count + 1));
  }
}

async function clearAndSchedule() {
  const alarms = await chrome.alarms.getAll();
  await Promise.all(alarms.filter(alarm => alarm.name.startsWith(ALARM_PREFIX)).map(alarm => chrome.alarms.clear(alarm.name)));
  const data = await chrome.storage.local.get(TASK_KEY);
  const now = new Date();
  (data[TASK_KEY] || []).filter(task => !task.completed).forEach(task => {
    if (task.time) scheduleTimed(task, now);
    else scheduleFlexible(task, now);
  });
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 2).getTime();
  createAlarm(REFRESH_ALARM, tomorrow);
}

chrome.runtime.onInstalled.addListener(clearAndSchedule);
chrome.runtime.onStartup.addListener(clearAndSchedule);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[TASK_KEY]) clearAndSchedule();
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === REFRESH_ALARM) { clearAndSchedule(); return; }
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;
  const [, taskId, reminder] = alarm.name.split('|');
  chrome.storage.local.get(TASK_KEY, data => {
    const task = (data[TASK_KEY] || []).find(item => item.id === taskId);
    if (!task || task.completed) return;
    
    let message = 'A gentle reminder for today.';
    if (reminder === 'timed-60') {
      message = '1 hour remaining till deadline';
    } else if (reminder === 'timed-10') {
      message = '10 minutes remaining till deadline';
    } else if (reminder === 'timed-passed') {
      message = 'Past the deadline';
    }

    chrome.notifications.create(alarm.name, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon.png'),
      title: task.title,
      message: message,
      priority: 2
    });
  });
});

