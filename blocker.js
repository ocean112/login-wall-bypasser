// Login Wall Bypasser — blocker.js v7.0
// Injected into page MAIN world via chrome.scripting — bypasses CSP
(function () {
  if (window.__lwb) return;
  window.__lwb = true;

  const HOST = location.hostname.replace('www.', '');

  const BAD = [
    'popads.net','popcash.net','propellerads.com','exoclick.com',
    'trafficjunky.net','adsterra.com','hilltopads.net','plugrush.com',
    'clickadu.com','adcash.com','evadav.com','zeropark.com',
    'adf.ly','sh.st','bc.vc','za.gl','ay.gy','clk.sh','exe.io',
    'fc.lc','shrinkme.io','gplinks.co','shorte.st','link1s.com',
    'linkvertise.com','loot-link.com','lootlinks.co',
    'doubleclick.net','googleadservices.com','juicyads.com',
    'mgid.com','revcontent.com','outbrain.com','taboola.com',
    'onclick.com','onclickads.net','adfly.com','clk.im','oke.io',
    'shrinkearn.com','cutwin.com','ouo.io','ouo.press','rlu.ru',
    'clk.asia','earnow.online','link.tl','exe.app',
  ];

  function host(url) {
    try { return new URL(url, location.href).hostname.replace('www.',''); }
    catch { return ''; }
  }
  function isScam(url) {
    if (!url || url === 'about:blank' || url.startsWith('javascript:')) return false;
    const h = host(url);
    return BAD.some(d => h === d || h.endsWith('.'+d));
  }
  function isExternal(url) {
    const h = host(url); return h && h !== HOST;
  }
  function block(url) {
    window.dispatchEvent(new CustomEvent('__lwb_blocked',{detail:{url:String(url)},bubbles:false}));
    console.log('[LWB] blocked →', url);
  }

  // Track real user clicks
  let lastClick = 0, lastClickHost = '';
  document.addEventListener('click', e => {
    if (!e.isTrusted) return;
    lastClick = Date.now();
    const a = e.target.closest('a[href]');
    lastClickHost = a ? host(a.href) : '';
  }, true);

  const recentClick = (ms=600) => Date.now() - lastClick < ms;
  const clickMatches = url => host(url) === HOST || host(url) === lastClickHost;

  // ── window.open ──
  // Only block new-tab opens that aren't from a real user click
  const _open = window.open;
  window.open = function(url, name, specs) {
    if (!url || url === 'about:blank') return _open.call(this, url, name, specs);
    if (isScam(url)) { block(url); return null; }
    if (isExternal(url) && !(recentClick() && clickMatches(url))) { block(url); return null; }
    return _open.call(this, url, name, specs);
  };

  // ── location navigation — allow if user clicked recently ──
  // This is important: blocks auto-redirects but allows "Enter Site" buttons
  function guardNav(url, fn) {
    if (isScam(url)) { block(url); return; }
    if (isExternal(url) && !recentClick(1200)) { block(url); return; }
    fn(url);
  }

  try {
    const _a = location.assign.bind(location);
    const _r = location.replace.bind(location);
    location.assign  = u => guardNav(u, _a);
    location.replace = u => guardNav(u, _r);
  } catch {}

  try {
    const d = Object.getOwnPropertyDescriptor(window.location, 'href');
    if (d?.set) Object.defineProperty(window.location, 'href', {
      get: d.get,
      set(u) { guardNav(u, v => d.set.call(this, v)); },
      configurable: true
    });
  } catch {}

  // ── setTimeout / setInterval — wipe click context so delayed opens are blocked ──
  const _st = setTimeout, _si = setInterval;
  window.setTimeout = function(fn, ms, ...a) {
    if (typeof fn !== 'function' || !ms || ms <= 0) return _st(fn, ms, ...a);
    return _st(function() {
      const s = lastClick; lastClick = 0;
      try { fn(...a); } finally { if (!lastClick) lastClick = s; }
    }, ms);
  };
  window.setInterval = function(fn, ms, ...a) {
    if (typeof fn !== 'function') return _si(fn, ms, ...a);
    return _si(function() {
      const s = lastClick; lastClick = 0;
      try { fn(...a); } finally { if (!lastClick) lastClick = s; }
    }, ms);
  };

  // ── Programmatic a.click() ──
  const _ac = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function() {
    if (this.href && isScam(this.href)) { block(this.href); return; }
    if (this.href && isExternal(this.href) && !recentClick()) { block(this.href); return; }
    _ac.call(this);
  };

  // ── form.submit() ──
  const _fs = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function() {
    if (this.action && isScam(this.action)) { block(this.action); return; }
    _fs.call(this);
  };

  // ── iframe scam src ──
  try {
    const _id = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'src');
    if (_id?.set) Object.defineProperty(HTMLIFrameElement.prototype,'src',{
      get:_id.get, set(u){if(isScam(u)){block(u);return;}_id.set.call(this,u);}, configurable:true
    });
  } catch {}

  // ── Fake dispatchEvent clicks ──
  const _de = EventTarget.prototype.dispatchEvent;
  EventTarget.prototype.dispatchEvent = function(ev) {
    if (!ev.isTrusted && ev.type==='click' && this instanceof HTMLAnchorElement
        && this.href && isScam(this.href)) { block(this.href); return false; }
    return _de.call(this, ev);
  };

  // ── Direct link clicks to scam domains ──
  document.addEventListener('click', e => {
    if (!e.isTrusted) return;
    const a = e.target.closest('a[href]');
    if (a && isScam(a.href)) { e.preventDefault(); e.stopImmediatePropagation(); block(a.href); }
  }, true);

  console.log('[LWB] blocker active on', HOST);
})();
