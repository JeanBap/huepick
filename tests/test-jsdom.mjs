import { JSDOM } from 'jsdom'; import fs from 'fs'; import path from 'path';
const EXT=process.env.EXT||path.resolve('../extension');
const html=fs.readFileSync(path.join(EXT,'popup.html'),'utf8');
const js=fs.readFileSync(path.join(EXT,'popup.js'),'utf8');
let fail=0; const ok=(c,m)=>{console.log((c?'PASS ✓':'FAIL ✗')+'  '+m); if(!c)fail++;};
const store={palette:['#aabbcc']}; const listeners=[]; let clip='';
const fire=o=>{const ch={};for(const k in o)ch[k]={newValue:o[k]};listeners.forEach(l=>l(ch,'local'));};
const merged=def=>{const o={};for(const k in def)o[k]=(k in store)?store[k]:def[k];return o;};
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true}); const {window}=dom;
window.chrome={
  storage:{local:{get:(d,cb)=>cb(merged(d)),set:(o,cb)=>{Object.assign(store,o);cb&&cb();fire(o);}},onChanged:{addListener:l=>listeners.push(l)}},
  tabs:{query:async()=>[{id:1,url:'https://example.com'}]},
  scripting:{executeScript:async({func,args})=>{const src=func.toString();
    if(src.includes('getBoundingClientRect')){
      const pd=new JSDOM('<body><div data-col="rgb(17, 34, 51)" data-bg="rgb(255, 255, 255)"></div><p data-col="rgb(68, 85, 102)" data-bg="rgba(0,0,0,0)"></p></body>');
      pd.window.Element.prototype.getBoundingClientRect=()=>({width:10,height:10,top:0,left:0,right:10,bottom:10});
      const gcs=el=>({color:el.dataset.col||'',backgroundColor:el.dataset.bg||'',borderTopColor:'',fill:'',stroke:''});
      return [{result:new Function('window','document','getComputedStyle','return ('+src+')();')(pd.window,pd.window.document,gcs)}];
    }
    return [{result:null}];
  }}
};
window.EyeDropper=undefined;
window.navigator.clipboard={writeText:t=>{clip=t;return Promise.resolve();}};
let promptVal='X'; window.prompt=()=>promptVal;
// ExtPay stub
let paid=false, opened=0;
window.ExtPay=()=>({getUser:()=>Promise.resolve({paid}),openPaymentPage:()=>{opened++;},onPaid:{addListener:()=>{}},startBackground:()=>{}});
window.eval(js);
const $=s=>window.document.querySelector(s);
const click=s=>$(s).dispatchEvent(new window.Event('click'));
const tick=()=>new Promise(r=>setTimeout(r,0));
await tick(); await tick();
// ---- FREE tier ----
ok($('#upgrade')&&$('#upgrade').hidden===false,'free: Upgrade button visible');
$('#hexin').value='#ff0000'; click('#add'); await tick();
ok(store.palettes[0].colors.includes('#ff0000'),'free: manual add works (free feature)');
ok(/AA/.test($('#contrast').innerHTML),'free: WCAG contrast works (free feature)');
let o=opened; click('#scan'); await tick(); await tick();
ok($('#pagecolors').children.length===0 && opened>o,'free: Scan is gated -> opens checkout');
o=opened; click('#export'); $('[data-f="CSS variables"]').dispatchEvent(new window.Event('click'));
ok(!/:root/.test(clip) && opened>o,'free: Export is gated -> opens checkout');
o=opened; const np=store.palettes.length; promptVal='Brand'; click('#newpal'); await tick();
ok(store.palettes.length===np && opened>o,'free: 2nd palette gated -> opens checkout');
// ---- upgrade to PRO ----
paid=true; window.refreshPro(); await tick(); await tick();
ok($('#upgrade').hidden===true,'pro: Upgrade button hidden after purchase');
click('#scan'); await tick(); await tick();
ok($('#pagecolors').children.length>0,'pro: Scan works');
$('#pagecolors').children[0].dispatchEvent(new window.Event('click')); await tick();
ok(store.palettes[0].colors.length>=3,'pro: add scanned colour to palette');
click('#export'); $('[data-f="Tailwind"]').dispatchEvent(new window.Event('click'));
ok(/colors: \{/.test(clip),'pro: Export works');
promptVal='Brand'; click('#newpal'); await tick();
ok(store.palettes.length===2 && store.palettes[1].name==='Brand','pro: multiple named palettes work');
console.log(fail?`\n❌ ${fail} FAILED`:'\n✅ ALL v2.1 PAYWALL TESTS PASSED — free gating + pro unlock verified');
process.exit(fail?1:0);
