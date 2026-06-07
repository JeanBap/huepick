# HuePick — Color Picker & Palette (Chrome / MV3)

Pick any colour on screen, build a palette, copy HEX / RGB / HSL, and check WCAG contrast. Local-first: your palette never leaves your device. No ads, no tracking, least-privilege (`storage` only).

## Why it exists
The popular eyedropper extensions are clunky, ad-laden, or harvest data. HuePick is the clean, fast, private alternative — and the first of a planned suite.

## Install (developer / review)
1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select the `extension/` folder
3. Click the toolbar icon → **Pick colour**

## Structure
- `extension/` — the loadable MV3 extension (manifest, popup, icons)
- `site/` — static landing + privacy pages (Cloudflare Pages build dir)

## Privacy
HuePick stores your palette only in `chrome.storage.local` on your machine. Nothing is transmitted. See `site/privacy.html`.

## License
MIT — see `LICENSE`.
