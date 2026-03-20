# 🔓 Login Wall Bypasser

A Chrome/Edge extension that removes login walls, cookie banners, notification popups, newsletter overlays, app download banners — and blocks malicious redirects on streaming sites.

Built by a beginner developer as a real-world project. Contributions welcome!

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔓 **Login Wall Removal** | Removes "Sign in to continue" overlays on Medium, Quora, news sites |
| 🍪 **Cookie Banner Blocker** | Auto-dismisses or removes cookie consent popups |
| 🔔 **Notification Blocker** | Blocks "Allow Notifications" prompts |
| 📧 **Newsletter Popup Blocker** | Removes email signup overlays |
| 📱 **App Banner Blocker** | Removes "Open in our App" sticky banners |
| 🛡️ **Redirect Blocker** | Blocks malicious redirects on streaming sites |
| 📊 **Stats & History** | Tracks how many walls removed across sites |
| ⚙️ **Whitelist / Blacklist** | Control which sites to bypass or skip |
| 📦 **Archive Redirect** | Opens page in Archive.org or Google Cache if bypass fails |

---

## 🚀 Installation

> Not yet on the Chrome Web Store. Install manually in under a minute.

1. [Download the latest release ZIP](../../releases/latest)
2. Unzip — you'll get a folder called `lwb-v7`
3. Open Chrome → go to `chrome://extensions`
4. Enable **Developer mode** (top right toggle)
5. Click **Load unpacked** → select the `lwb-v7` folder
6. Pin the 🔓 icon to your toolbar

> **Edge users:** Same steps, use `edge://extensions` instead.
> **Brave/Opera users:** Same steps, works out of the box.

---

## 🧪 Sites to Test On

| Site | What gets removed |
|---|---|
| `medium.com` | Login wall after reading a few articles |
| `quora.com` | Signup overlay when scrolling |
| `businessinsider.com` | Subscription wall |
| `hindustantimes.com` | Cookie banner + notification prompt |
| `ndtv.com` | Cookie banner |
| `forbes.com` | Newsletter popup |
| `reddit.com` | App download banner |

---

## 🗂️ Project Structure

```
lwb-v7/
├── manifest.json       # Extension config (Manifest V3)
├── content.js          # Main script — popup removal + CSS injection
├── blocker.js          # Injected into MAIN world — redirect blocker (CSP-safe)
├── background.js       # Service worker — badge + stats
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
└── icons/              # Extension icons
```

---

## ⚙️ How It Works

### Popup Removal
Two strategies working together:

1. **CSS injection at `document_start`** — hides known popup selectors before the page even paints, so popups never flash visible
2. **DOM scanning** — scans at 200ms, 1.2s and 3.5s after load to catch dynamically injected popups CSS missed, using keyword matching + CSS position checks

### Redirect Blocking
The redirect blocker is injected into the page's **MAIN world** via `chrome.scripting.executeScript` — this bypasses site CSP entirely. It intercepts:

- `window.open` — blocks unsolicited new tab opens
- `location.href / assign / replace` — blocks automatic page hijacks
- `setTimeout / setInterval` — wipes click context so delayed popups are blocked
- `HTMLAnchorElement.prototype.click` — blocks programmatic fake clicks
- `HTMLFormElement.prototype.submit` — blocks form redirects to scam domains
- `iframe.src` — blocks scam iframes

---

## 🤝 Contributing

Contributions are very welcome! Here are good ways to help:

### Good First Issues
- Add CSS selectors for popups we miss on specific sites
- Add more domains to the scam redirect blocklist in `blocker.js`
- Test on sites and open issues for popups that still appear
- Improve the popup UI
- Translate the popup to Hindi or other languages

### How to Contribute
1. Fork this repository
2. Create a branch: `git checkout -b fix/site-name-popup`
3. Make your changes and test locally
4. Open a Pull Request describing what you changed and why

### Reporting a Bug
Open an issue with:
- The site URL where the popup appeared
- What the popup said
- What happened when you clicked Scan & Remove
- Screenshot if possible

---

## 🗺️ Roadmap

- [ ] Publish to Chrome Web Store
- [ ] Publish to Microsoft Edge Add-ons Store  
- [ ] Improve redirect blocking on streaming sites
- [ ] Site-specific rules for known problematic sites
- [ ] Firefox support
- [ ] Export/import whitelist settings

---

## ⚠️ Known Limitations

- **Hard login walls** — if a site requires login at the server (Netflix, Instagram), content is never sent to the browser. Can't bypass those.
- **Streaming site redirects** — piracy sites rotate domains constantly. We block many but not all.
- **Some React apps** — heavy SPAs can occasionally break. If a site breaks, whitelist it in the popup → Lists tab.

---

## 📄 License

MIT License — free to use, modify and distribute.

---

## 👨‍💻 Author

Built as a first open source project while learning web development and cybersecurity.

Follow the journey on Threads: pal._.sagar 
Built from Ghaziabad, India 🇮🇳
Gmail: sagarpal69633@gmail.com

---

> ⭐ If this helped you, give it a star — it helps others find it!
