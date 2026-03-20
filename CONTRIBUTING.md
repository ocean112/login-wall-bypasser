# Contributing to Login Wall Bypasser

Thanks for wanting to help! This is a beginner-friendly project and all contributions are welcome — big or small.

## 🐛 Reporting a Bug

Open a [GitHub Issue](../../issues/new) with:
- The website URL
- What popup or redirect still appeared
- What happened when you clicked "Scan & Remove"
- Your Chrome/Edge version

## 💡 Suggesting a Feature

Open an Issue with the label `enhancement` and describe what you'd like.

## 🔧 Making a Code Change

1. Fork the repo and clone it locally
2. Load the extension in Chrome: `chrome://extensions` → Developer mode → Load unpacked → select the folder
3. Make your change
4. Reload the extension in `chrome://extensions` (click the refresh icon)
5. Test it on a real site
6. Submit a Pull Request

## 📁 Which File to Edit?

| What you want to change | File |
|---|---|
| Add a CSS selector for a known popup | `content.js` → `HIDE_CSS` block or selector arrays |
| Add a known scam redirect domain | `blocker.js` → `BAD` array |
| Change how popups are detected | `content.js` → `looksLikePopup()` function |
| Change the popup UI | `popup.html` + `popup.js` |
| Change badge or stats logic | `background.js` |

## ✅ Good First Contributions

- Visit a site, find a popup that wasn't removed, inspect the element in DevTools, find its class/id, add a selector to `content.js`
- Find a streaming site redirect domain, add it to the `BAD` array in `blocker.js`
- Fix a typo or improve wording in the README

No contribution is too small!
