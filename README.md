# HuePick — Color Picker, Palettes & Page Scanner (Chrome / MV3)

The clean, private alternative to ColorZilla and Eye Dropper. Local-first: nothing leaves your device. No ads, no tracking, least-privilege.

**v2.0.0**
- **Eyedrop** any pixel (runs in the page, so it survives the popup closing) or type a HEX.
- **Scan page** — extract every colour actually used on the current page, click any to keep.
- **Named, reorderable palettes** — multiple sets, switch/rename/delete, move and remove colours.
- **Export** to CSS variables, Tailwind config, JSON, or a plain list — one click.
- **Accessibility built in** — WCAG AA/AAA pass-fail on white and black, plus a colour-blindness preview (protan/deutan/tritan).
- Copy HEX / RGB / HSL. Old v1 palettes auto-migrate.

## Install (developer / review)
1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select the `extension/` folder.

## Test
`cd tests && npm install` then `npm run validate`, `npm run test:jsdom` (runs the real popup logic, 17 checks), `npm test` (headless Chrome). All green.

## Layout
`extension/` (loadable MV3) · `site/` (landing + privacy, Cloudflare Pages dir) · `tests/` (harness)

## Privacy
Only your palettes are stored, in `chrome.storage.local`, on your device. Scan reads page colours in memory to show them; nothing is stored or transmitted. MIT licensed.
