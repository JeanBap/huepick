# HuePick — Color Picker, Palettes & Page Scanner (Chrome / MV3)

The clean, private alternative to ColorZilla. Local-first, no ads, no tracking.

**v2.1.0 — now with Pro.**

### Free
Eyedropper pick, copy HEX/RGB/HSL, one palette, WCAG AA/AAA contrast, colour-blindness preview.

### Pro — $9.99 lifetime or $2.99/month
Page scanner (extract every colour on a page), export to CSS variables / Tailwind / JSON, unlimited named palettes.

Payments use **ExtensionPay** (Stripe-backed) because the Chrome Web Store no longer processes payments. The Upgrade button opens checkout; paid features unlock instantly. Purchases work across devices via ExtensionPay login.

## Install (developer / review)
`chrome://extensions` → Developer mode → Load unpacked → select `extension/`.

## Test
`cd tests && npm install` → `npm run validate`, `npm run test:jsdom` (paywall + features, 11 checks), `npm test` (headless Chrome).

## Go-live (owner)
1. ExtensionPay: sign up at extensionpay.com, connect Stripe, register extension slug **huepick**, add two plans — $9.99 one-time and $2.99/month.
2. Chrome Web Store: $5 dev account, 2-Step Verification, identity verification, then upload `extension/` (zipped) with `store-listing.md` copy.

## Privacy
Palettes stored only in `chrome.storage.local`. Scan reads page colours in memory. No tracking. MIT licensed.
