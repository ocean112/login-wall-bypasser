// Login Wall Bypasser — background.js v7.0

function setBadge(tabId, n) {
  chrome.action.setBadgeText({ text: n > 0 ? (n > 99 ? '99+' : String(n)) : '', tabId });
  if (n > 0) chrome.action.setBadgeBackgroundColor({ color: '#7c3aed', tabId });
}

async function saveWall(url, count) {
  if (!count || !url?.startsWith('http')) return;
  try {
    const { history=[], totalWalls=0 } = await chrome.storage.sync.get(['history','totalWalls']);
    const hn = new URL(url).hostname.replace('www.','');
    const i  = history.findIndex(h => h.hostname === hn);
    const now = Date.now();
    if (i >= 0) { history[i].count += count; history[i].lastSeen = now; }
    else history.unshift({ hostname: hn, count, lastSeen: now });
    await chrome.storage.sync.set({ history: history.slice(0,50), totalWalls: totalWalls + count });
  } catch {}
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  const tid = sender.tab?.id;
  if (!tid) return;
  if (msg.action === 'wallResult') { setBadge(tid, msg.count); saveWall(sender.tab?.url, msg.count); }
  if (msg.action === 'badge')      { setBadge(tid, msg.count); }
  if (msg.action === 'injectBlocker') {
    chrome.scripting.executeScript({
      target: { tabId: tid },
      files: ['blocker.js'],
      world: 'MAIN'
    }).catch(() => {});
  }
});

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === 'loading') chrome.action.setBadgeText({ text: '', tabId });
});
