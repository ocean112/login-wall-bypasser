// Login Wall Bypasser — content.js v7.0
// Runs at document_start so CSS fires before page paints

const HOST = location.hostname.replace('www.', '');
let removed = 0;
let redirectsBlocked = 0;

// ═══════════════════════════════════════════════════
//  PART 1 — CSS injection (fires immediately at document_start)
//  Hides popups before they ever appear on screen
// ═══════════════════════════════════════════════════
const HIDE_CSS = `
  /* Cookie banners */
  #onetrust-banner-sdk, #onetrust-consent-sdk, #onetrust-pc-sdk,
  .cc-window, .cc-banner, .cc-overlay,
  #cookieConsent, #cookie-consent, #cookie-banner,
  .cookie-banner, .cookie-notice, .cookie-bar, .cookiebanner,
  #CybotCookiebotDialog, #CybotCookiebotDialogBodyUnderlay,
  [id*="cookie-bar"], [id*="cookie-notice"], [id*="cookie-banner"],
  [class*="cookie-banner"], [class*="cookie-bar"], [class*="cookie-notice"],
  [id*="gdpr"], [class*="gdpr"],
  .qc-cmp2-container, .qc-cmp2-ui, #sp-cc,
  .truste_overlay, .evidon-banner,
  [id*="consent-banner"], [class*="consent-banner"],

  /* Notification prompts */
  .push-notification-bar, .notification-prompt, .webpush-prompt,
  [class*="push-prompt"], [id*="push-prompt"],

  /* App banners */
  .smartbanner, #smartbanner,
  [id*="app-banner"], [class*="app-banner"],
  [class*="app-install"], [id*="app-install"],

  /* Newsletter & email popups */
  [class*="newsletter-popup"], [id*="newsletter-popup"],
  [class*="email-popup"], [id*="email-popup"],
  [class*="subscribe-popup"], [id*="subscribe-popup"],
  [class*="email-capture"], .optinmonster-holder, .pum-container,

  /* Paywall / login wall overlays */
  [class*="paywall"]:not(article):not(section):not(main),
  [id*="paywall"],
  [class*="login-wall"], [id*="login-wall"],
  [class*="signup-wall"], [id*="signup-wall"],
  [class*="content-gate"], [id*="content-gate"],

  /* Generic modal backdrops */
  .modal-backdrop, .overlay-backdrop,
  .fancybox-overlay, .fancybox-bg
  {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  /* Restore scroll locked by popup JS */
  body.modal-open, body.no-scroll, body.noscroll,
  body.overflow-hidden, body.locked, html.no-scroll,
  body.body--fixed {
    overflow: auto !important;
    position: static !important;
    height: auto !important;
  }
`;

function addCSS(css) {
  const s = document.createElement('style');
  s.id = '__lwb';
  s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
}

// Inject immediately
addCSS(HIDE_CSS);

// ═══════════════════════════════════════════════════
//  PART 2 — DOM scanner
//  Removes popups that CSS missed (dynamic / obfuscated classes)
// ═══════════════════════════════════════════════════

// Words that appear in popup text — short so they match more variants
const POPUP_WORDS = [
  // Login walls
  'sign in to continue', 'log in to continue', 'login to continue',
  'create an account', 'subscribe to read', 'subscribe to continue',
  'subscribe now', 'sign up to', 'register to continue',
  'members only', 'unlock this', 'have an account',
  // Cookies
  'use cookies', 'accept cookies', 'cookie policy',
  'accept all', 'manage cookies', 'we and our partners',
  // Notifications
  'allow notifications', 'enable notifications',
  'send you notifications', 'push notifications',
  // Newsletter
  'subscribe to our', 'join our newsletter',
  'sign up for our', 'get updates', 'weekly newsletter',
  // App
  'open in app', 'get the app', 'download our app', 'view in app',
];

// Tags and IDs we never remove
const SKIP_TAGS = new Set(['HTML','HEAD','BODY','SCRIPT','STYLE','LINK','META',
  'HEADER','FOOTER','MAIN','NAV','ASIDE','NOSCRIPT','SVG','IMG','VIDEO','CANVAS','IFRAME']);
const SKIP_IDS  = new Set(['root','app','__next','__nuxt','main','content',
  'header','footer','nav','wrapper','container','page','layout','app-root']);

function looksLikePopup(el) {
  try {
    if (SKIP_TAGS.has(el.tagName)) return false;
    if (SKIP_IDS.has((el.id || '').toLowerCase())) return false;

    const cs   = getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    // Must be visible
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (parseFloat(cs.opacity) < 0.05) return false;

    // Must be positioned overlay
    if (cs.position !== 'fixed' && cs.position !== 'absolute') return false;

    // Must have high z-index
    if (parseInt(cs.zIndex || 0) < 10) return false;

    // Must have meaningful size
    if (rect.width < 80 || rect.height < 50) return false;

    // Skip huge containers (likely the whole page, not a popup)
    if (el.querySelectorAll('*').length > 200) return false;

    // Must contain popup-related text
    const text = (el.innerText || el.textContent || '').toLowerCase();
    if (text.length < 10) return false;
    return POPUP_WORDS.some(w => text.includes(w));

  } catch { return false; }
}

function remove(el, reason) {
  if (!el || !el.parentNode) return;
  el.remove();
  removed++;
  console.log('[LWB] removed', reason, el.tagName, el.id || '');
}

function unlockScroll() {
  const b = document.body;
  const h = document.documentElement;
  b.style.overflow = b.style.height = b.style.position = '';
  h.style.overflow = h.style.height = '';
  ['modal-open','no-scroll','noscroll','overflow-hidden',
   'locked','body-lock','is-modal-open','body--fixed'].forEach(c => {
    b.classList.remove(c);
    h.classList.remove(c);
  });
}

function tryClickDismiss(el) {
  const labels = ['reject all','decline','reject','close','dismiss',
                  'got it','i agree','agree','accept all','accept','ok','allow','continue'];
  for (const btn of el.querySelectorAll('button,[role="button"],[class*="btn"],[class*="button"]')) {
    const t = (btn.innerText || btn.textContent || '').toLowerCase().trim();
    if (labels.some(l => t === l || t.startsWith(l))) {
      try { btn.click(); return true; } catch {}
    }
  }
  return false;
}

// Named-selector removal (fast, catches known patterns)
const COOKIE_SELECTORS = [
  '#onetrust-banner-sdk','#onetrust-consent-sdk','.cc-window','.cc-banner',
  '#cookieConsent','#cookie-consent','#cookie-banner','.cookie-banner',
  '.cookie-notice','.cookiebanner','#CybotCookiebotDialog',
  '.qc-cmp2-container','#sp-cc','.truste_overlay',
  '[id*="cookie-bar"]','[id*="cookie-notice"]','[id*="cookie-banner"]',
  '[class*="cookie-banner"]','[class*="gdpr-banner"]','[id*="consent-banner"]',
];
const NOTIF_SELECTORS = [
  '.push-notification-bar','.notification-prompt','.webpush-prompt',
  '[class*="push-prompt"]','[id*="push-prompt"]',
];
const APP_SELECTORS = [
  '.smartbanner','#smartbanner',
  '[id*="app-banner"]','[class*="app-banner"]','[class*="app-install"]',
];
const NEWSLETTER_SELECTORS = [
  '[class*="newsletter-popup"]','[id*="newsletter-popup"]',
  '[class*="email-popup"]','[id*="email-popup"]',
  '[class*="subscribe-popup"]','[id*="subscribe-popup"]',
  '[class*="email-capture"]','.optinmonster-holder','.pum-container',
];
const PAYWALL_SELECTORS = [
  '[class*="paywall"]:not(article):not(section):not(main)',
  '[id*="paywall"]','[class*="login-wall"]','[class*="signup-wall"]',
  '[class*="content-gate"]','[id*="content-gate"]',
];

function scan(s = {}) {
  if (s.blockCookies !== false) {
    COOKIE_SELECTORS.forEach(sel =>
      document.querySelectorAll(sel).forEach(el => { if (!tryClickDismiss(el)) remove(el, 'cookie'); })
    );
  }
  if (s.blockNotifs !== false) {
    NOTIF_SELECTORS.forEach(sel => document.querySelectorAll(sel).forEach(el => remove(el, 'notif')));
    try { Notification.requestPermission = () => Promise.resolve('denied'); } catch {}
  }
  if (s.blockAppBanners !== false) {
    APP_SELECTORS.forEach(sel =>
      document.querySelectorAll(sel).forEach(el => {
        if (/app|install|download/i.test(el.innerText || el.textContent || '')) remove(el, 'app');
      })
    );
  }
  if (s.blockNewsletters !== false) {
    NEWSLETTER_SELECTORS.forEach(sel => document.querySelectorAll(sel).forEach(el => remove(el, 'newsletter')));
  }

  // Paywall selectors (always active)
  PAYWALL_SELECTORS.forEach(sel => document.querySelectorAll(sel).forEach(el => remove(el, 'paywall')));

  // Generic overlay scan — catches obfuscated popups
  document.querySelectorAll('*').forEach(el => { if (looksLikePopup(el)) remove(el, 'overlay'); });

  // Remove blur paywalls
  document.querySelectorAll('[style*="blur"]').forEach(el => {
    el.style.filter = ''; el.style.webkitFilter = '';
  });

  unlockScroll();
  return removed;
}

// ═══════════════════════════════════════════════════
//  PART 3 — Redirect blocker injection
// ═══════════════════════════════════════════════════
let rbInjected = false;

function injectBlocker() {
  if (rbInjected) return;
  rbInjected = true;
  window.addEventListener('__lwb_blocked', e => logRedirect(e.detail?.url));
  chrome.runtime.sendMessage({ action: 'injectBlocker' }).catch(() => {});
}

async function logRedirect(url) {
  if (!url) return;
  redirectsBlocked++;
  try {
    const d = await chrome.storage.sync.get(['redirectLog','totalRedirects']);
    const log = d.redirectLog || [];
    let host = url;
    try { host = new URL(url).hostname.replace('www.',''); } catch {}
    log.unshift({ url: url.slice(0,100), host, time: Date.now() });
    await chrome.storage.sync.set({ redirectLog: log.slice(0,30), totalRedirects: (d.totalRedirects||0)+1 });
  } catch {}
  chrome.runtime.sendMessage({ action: 'badge', count: removed + redirectsBlocked }).catch(() => {});
}

// ═══════════════════════════════════════════════════
//  PART 4 — Main run
// ═══════════════════════════════════════════════════
async function run() {
  const cfg = await chrome.storage.sync.get([
    'whitelist','blacklist','autoBypass',
    'blockCookies','blockNotifs','blockNewsletters','blockAppBanners','blockRedirects'
  ]);

  const wl = cfg.whitelist || [];
  const bl = cfg.blacklist || [];

  if (wl.some(h => HOST.includes(h))) {
    document.getElementById('__lwb')?.remove(); // remove our CSS on whitelisted sites
    return;
  }

  const forced = bl.some(h => HOST.includes(h));
  if (cfg.autoBypass === false && !forced) {
    document.getElementById('__lwb')?.remove();
    return;
  }

  if (cfg.blockRedirects !== false) injectBlocker();

  // Scan at 3 intervals to catch early, normal, and late-loading popups
  scan(cfg);
  setTimeout(() => scan(cfg), 1200);
  setTimeout(() => scan(cfg), 3500);

  // Watch for dynamically added popups
  let t = null;
  new MutationObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => {
      const prev = removed;
      scan(cfg);
      if (removed !== prev)
        chrome.runtime.sendMessage({ action: 'badge', count: removed + redirectsBlocked }).catch(() => {});
    }, 150);
  }).observe(document.documentElement, { childList: true, subtree: true });

  chrome.runtime.sendMessage({ action: 'wallResult', count: removed }).catch(() => {});
}

// document_start = no DOMContentLoaded needed, but DOM isn't ready yet
// so defer the JS scan, while CSS already fired above
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(run, 200));
} else {
  setTimeout(run, 200);
}

// ── Messages from popup ──
chrome.runtime.onMessage.addListener((msg, _, reply) => {
  if (msg.action === 'manualScan') {
    chrome.storage.sync.get(['blockCookies','blockNotifs','blockNewsletters','blockAppBanners','blockRedirects'], cfg => {
      if (cfg.blockRedirects !== false) injectBlocker();
      scan(cfg);
      chrome.runtime.sendMessage({ action: 'badge', count: removed + redirectsBlocked }).catch(() => {});
      reply({ count: removed, blocked: redirectsBlocked });
    });
    return true;
  }
  if (msg.action === 'getCount') reply({ count: removed, blocked: redirectsBlocked });
  if (msg.action === 'redirectArchive') {
    const u = location.href;
    window.open(msg.service === 'archive'
      ? `https://web.archive.org/web/*/${u}`
      : `https://webcache.googleusercontent.com/search?q=cache:${u}`, '_blank');
    reply({ ok: true });
  }
});
