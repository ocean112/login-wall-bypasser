// Login Wall Bypasser — popup.js v7.0

const $ = id => document.getElementById(id);
const getTab = () => new Promise(r => chrome.tabs.query({active:true,currentWindow:true}, t => r(t[0])));
const ago = ts => { const m=Math.floor((Date.now()-ts)/60000); return m<1?'just now':m<60?m+'m ago':Math.floor(m/60)+'h ago'; };
const norm = s => s.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0];

// ── Tabs ──
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
  document.querySelectorAll('.pnl').forEach(x => x.classList.remove('on'));
  t.classList.add('on');
  $('p-'+t.dataset.t)?.classList.add('on');
  if (t.dataset.t === 'stats')   loadStats();
  if (t.dataset.t === 'blocked') loadBlocked();
  if (t.dataset.t === 'lists')   loadLists();
}));

// ── Status ──
function showStatus(count, blocked) {
  const total = (count||0)+(blocked||0);
  if (total > 0) {
    $('ico').textContent = '✅';
    const p = [];
    if (count   > 0) p.push(count   + ' popup'    + (count   > 1?'s':'') + ' removed');
    if (blocked > 0) p.push(blocked + ' redirect' + (blocked > 1?'s':'') + ' blocked');
    $('tx').textContent = p.join(' · ');
    $('sx').textContent = 'Page is clean!';
    $('bdg').style.display = 'inline-block';
    $('bdg').textContent = String(total);
  } else {
    $('ico').textContent = '😌';
    $('tx').textContent  = 'No threats detected';
    $('sx').textContent  = 'This page looks clean!';
    $('bdg').style.display = 'none';
  }
}

getTab().then(tab => {
  if (!tab) return;
  chrome.tabs.sendMessage(tab.id, {action:'getCount'}, res => {
    if (chrome.runtime.lastError || !res) return;
    showStatus(res.count, res.blocked);
  });
});

// ── Toggles ──
const KEYS = {tAuto:'autoBypass',tCookie:'blockCookies',tNotif:'blockNotifs',tNews:'blockNewsletters',tApp:'blockAppBanners',tRedir:'blockRedirects'};
chrome.storage.sync.get(Object.values(KEYS), res => {
  Object.entries(KEYS).forEach(([id,k]) => { const el=$(id); if(el) el.checked = res[k]!==false; });
});
Object.entries(KEYS).forEach(([id,k]) => $(id)?.addEventListener('change', e => chrome.storage.sync.set({[k]:e.target.checked})));

// ── Buttons ──
$('scanBtn').addEventListener('click', async () => {
  const tab = await getTab(); if (!tab) return;
  $('ico').textContent='⚡'; $('tx').textContent='Scanning...'; $('sx').textContent='Hunting walls & popups'; $('bdg').style.display='none';
  chrome.tabs.sendMessage(tab.id, {action:'manualScan'}, res => {
    if (chrome.runtime.lastError||!res) { $('ico').textContent='⚠️'; $('tx').textContent='Could not reach page'; $('sx').textContent='Try reloading the tab first'; return; }
    showStatus(res.count, res.blocked);
  });
});
$('reloadBtn').addEventListener('click', async () => { const t=await getTab(); if(t){chrome.tabs.reload(t.id);window.close();}});
$('archBtn').addEventListener('click',  async () => { const t=await getTab(); if(t) chrome.tabs.sendMessage(t.id,{action:'redirectArchive',service:'archive'}); });
$('cacheBtn').addEventListener('click', async () => { const t=await getTab(); if(t) chrome.tabs.sendMessage(t.id,{action:'redirectArchive',service:'google'}); });

// ── Stats ──
async function loadStats() {
  const {history=[],totalWalls=0} = await chrome.storage.sync.get(['history','totalWalls']);
  $('stW').textContent = totalWalls; $('stS').textContent = history.length;
  const el = $('hList');
  if (!history.length) { el.innerHTML='<div class="emp">No walls removed yet.<br>Browse around!</div>'; return; }
  el.innerHTML='';
  history.forEach(h => {
    const d=document.createElement('div'); d.className='li';
    const L=document.createElement('div');
    const hn=document.createElement('div'); hn.className='lh';
    const dt=document.createElement('div'); dt.className='ld';
    const ct=document.createElement('span'); ct.className='lb';
    hn.textContent=h.hostname; dt.textContent=ago(h.lastSeen); ct.textContent=h.count+' removed';
    L.append(hn,dt); d.append(L,ct); el.appendChild(d);
  });
}
$('clrH').addEventListener('click', async () => { await chrome.storage.sync.set({history:[],totalWalls:0}); loadStats(); });

// ── Blocked redirects ──
async function loadBlocked() {
  const {redirectLog=[],totalRedirects=0} = await chrome.storage.sync.get(['redirectLog','totalRedirects']);
  $('stR').textContent  = totalRedirects;
  $('stRS').textContent = new Set(redirectLog.map(r=>r.host)).size;
  const el = $('rList');
  if (!redirectLog.length) { el.innerHTML='<div class="emp">No redirects blocked yet.<br>Visit a streaming site!</div>'; return; }
  el.innerHTML='';
  redirectLog.forEach(r => {
    const d=document.createElement('div'); d.className='li';
    const L=document.createElement('div'); L.style.overflow='hidden';
    const h=document.createElement('div'); h.className='lh lr';
    const u=document.createElement('div'); u.className='ld'; u.style.cssText='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:210px';
    const t=document.createElement('div'); t.className='ld';
    h.textContent='🚫 '+r.host; u.textContent=r.url; t.textContent=ago(r.time);
    L.append(h,u,t); d.appendChild(L); el.appendChild(d);
  });
}
$('clrR').addEventListener('click', async () => { await chrome.storage.sync.set({redirectLog:[],totalRedirects:0}); loadBlocked(); });

// ── Lists ──
async function loadLists() {
  const {whitelist=[],blacklist=[]} = await chrome.storage.sync.get(['whitelist','blacklist']);
  renderTags('wlT', whitelist, 'whitelist');
  renderTags('blT', blacklist, 'blacklist');
}
function renderTags(cid, items, key) {
  const c=$(cid); c.innerHTML='';
  if (!items.length) { const s=document.createElement('span'); s.style.cssText='font-size:10px;color:#4b5563'; s.textContent='None added yet'; c.appendChild(s); return; }
  items.forEach((item,i) => {
    const tag=document.createElement('span'); tag.className='tag';
    const lbl=document.createElement('span'); lbl.textContent=item;
    const x=document.createElement('span'); x.className='tx2'; x.textContent='×';
    x.addEventListener('click', async () => {
      const {[key]:arr=[]} = await chrome.storage.sync.get([key]);
      arr.splice(i,1); await chrome.storage.sync.set({[key]:arr}); loadLists();
    });
    tag.append(lbl,x); c.appendChild(tag);
  });
}
async function addToList(key, inputId) {
  const inp=$(inputId); const val=norm(inp.value); if(!val) return;
  const {[key]:arr=[]} = await chrome.storage.sync.get([key]);
  if (!arr.includes(val)) { arr.push(val); await chrome.storage.sync.set({[key]:arr}); }
  inp.value=''; loadLists();
}
$('wlA').addEventListener('click', () => addToList('whitelist','wlI'));
$('blA').addEventListener('click', () => addToList('blacklist','blI'));
$('wlI').addEventListener('keydown', e => { if(e.key==='Enter') addToList('whitelist','wlI'); });
$('blI').addEventListener('keydown', e => { if(e.key==='Enter') addToList('blacklist','blI'); });
async function addCurrent(key) {
  const tab=await getTab(); if(!tab?.url) return;
  try {
    const host=new URL(tab.url).hostname.replace('www.','');
    const {[key]:arr=[]} = await chrome.storage.sync.get([key]);
    if (!arr.includes(host)) { arr.push(host); await chrome.storage.sync.set({[key]:arr}); }
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
    document.querySelectorAll('.pnl').forEach(p=>p.classList.remove('on'));
    document.querySelector('[data-t="lists"]').classList.add('on');
    $('p-lists').classList.add('on'); loadLists();
  } catch {}
}
$('addWL').addEventListener('click', () => addCurrent('whitelist'));
$('addBL').addEventListener('click', () => addCurrent('blacklist'));
