# HuePick — Color Picker & Palette (Chrome / MV3)

Pick any colour on screen, build a palette, copy HEX / RGB / HSL, check WCAG contrast. Local-first: your palette never leaves your device. No ads, no tracking, least-privilege.

**v1.0.1** — robust picking: the eyedropper now runs in the page and writes the colour directly, so it survives the popup closing. Added a manual HEX field that always works, plus live palette updates and a full automated test harness.

## Install (developer / review)
1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select the `extension/` folder
3. Click the toolbar icon → type a hex and **Add**, or click **Pick** and eyedrop any pixel.

## Test it
See `tests/` — `npm run validate`, `npm run test:jsdom` (runs the real popup logic), and `npm test` (headless Chrome). All green.

## Layout
- `extension/` — loadable MV3 extension
- `site/` — landing + privacy pages (Cloudflare Pages dir)
- `tests/` — automated test harness

## Privacy
Palette is stored only in `chrome.storage.local`. Nothing is transmitted. MIT licensed.
