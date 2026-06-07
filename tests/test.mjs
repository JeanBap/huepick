import puppeteer from 'puppeteer'; import path from 'path';
const EXT=process.env.EXT||path.resolve('../extension');
let fail=0; const ok=(c,m)=>{console.log((c?'PASS':'FAIL')+'  '+m); if(!c)fail++;};
const browser=await puppeteer.launch({headless:'new',args:[`--disable-extensions-except=${EXT}`,`--load-extension=${EXT}`,'--no-sandbox','--disable-setuid-sandbox']});
let id;
for(let i=0;i<40;i++){const t=browser.targets().find(t=>t.type()==='service_worker'&&t.url().startsWith('chrome-extension://'));if(t){id=t.url().split('/')[2];break;}await new Promise(r=>setTimeout(r,250));}
ok(!!id,'extension loaded (service worker found): '+id);
if(!id){await browser.close();process.exit(1);}
const page=await browser.newPage();
await page.goto(`chrome-extension://${id}/popup.html`,{waitUntil:'domcontentloaded'});
ok(/HuePick/.test(await page.$eval('.logo',e=>e.textContent)),'popup renders');
await page.type('#hexin','#ff0000'); await page.click('#add');
await page.waitForSelector('#palette li',{timeout:3000});
ok((await page.$$eval('#palette li',e=>e.length))===1,'manual add -> 1 swatch in palette');
ok(/255,\s*0,\s*0|#ff0000/.test(await page.$eval('#swatch',e=>e.style.background)),'current swatch is red');
ok(/white|black/.test(await page.$eval('#contrast',e=>e.textContent)),'WCAG contrast shown');
const stored=await page.evaluate(()=>new Promise(r=>chrome.storage.local.get({palette:[]},d=>r(d.palette))));
ok(stored.length===1&&stored[0]==='#ff0000','palette persisted to chrome.storage.local');
await page.reload({waitUntil:'domcontentloaded'}); await page.waitForSelector('#palette li',{timeout:3000});
ok((await page.$$eval('#palette li',e=>e.length))===1,'palette survives popup reopen');
await page.click('#clear'); await new Promise(r=>setTimeout(r,300));
ok((await page.$$eval('#palette li',e=>e.length))===0,'clear empties palette');
await browser.close();
console.log(fail?`\n${fail} TEST(S) FAILED`:'\nALL BROWSER TESTS PASSED ✅');
process.exit(fail?1:0);
