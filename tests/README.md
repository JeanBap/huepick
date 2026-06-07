# HuePick tests
Reusable test harness for the extension (and the template for all future ones).

```
cd tests
npm install
npm run validate     # static: MV3 manifest + icon/file integrity (no browser)
npm run test:jsdom   # runs the real popup.js against stubbed Chrome APIs (fast, no browser)
npm test             # loads the unpacked extension in headless Chrome (Puppeteer) and drives the UI
```
`validate` + `test:jsdom` need only Node. `npm test` downloads a headless Chromium on first run.
