import { JSDOM } from 'jsdom'; import fs from 'fs'; import path from 'path';
const EXT=process.env.EXT||path.resolve('../extension');
const html=fs.readFileSync(path.join(EXT,'popup.html'),'utf8');
const js=fs.readFileSync(path.join(EXT,'popup.js'),'utf8');
let fail=0; const ok=(c,m)=>{console.log((c?'PASS ✓':'FAIL ✗')+'  '+m); if(!c)fail++;};
const store={}; const listeners=[];
const fire=obj=>{const ch={};for(const k in obj)ch[k]={newValue:obj[k]};listeners.forEach(l=>l(ch,'local'));};
let clip='';
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true});
const {window}=dom;
window.chrome={
  storage:{local:{
    get:(def,cb)=>{const o={};for(const k in def)o[k]=(k in store)?store[k]:def[k];cb(o);},
    set:(obj,cb)=>{Object.assign(store,obj);cb&&cb();fire(obj);}
  },onChanged:{addListener:l=>listeners.push(l)}},
  tabs:{query:async()=>[{id:1,url:'https://example.com'}]},
  scripting:{executeScript:async({func})=>{
    const src=func.toString();
    const pageWindow={EyeDropper:class{async open(){return{sRGBHex:'#00ff00'};}}};
    const pageChrome={storage:{local:{
      get:def=>Promise.resolve((()=>{const o={};for(const k in def)o[k]=(k in store)?store[k]:def[k];return o;})()),
      set:obj=>{Object.assign(store,obj);fire(obj);return Promise.resolve();}
    }}};
    const runner=new Function('window','chrome','return ('+src+')();');
    return [{result:await runner(pageWindow,pageChrome)}];
  }}
};
window.EyeDropper=undefined;
window.navigator.clipboard={writeText:t=>{clip=t;return Promise.resolve();}};
window.eval(js);
const $=s=>window.document.querySelector(s);
const click=s=>$(s).dispatchEvent(new window.Event('click'));
const tick=()=>new Promise(r=>setTimeout(r,0));

$('#hexin').value='#ff0000'; click('#add'); await tick();
ok(store.palette&&store.palette.length===1&&store.palette[0]==='#ff0000','manual add persists #ff0000 to chrome.storage');
ok($('#palette').children.length===1,'palette renders 1 swatch');
ok(/255, 0, 0|#ff0000/.test($('#swatch').style.background),'current swatch shows the colour');
ok(/black/.test($('#contrast').textContent),'WCAG contrast computed: '+JSON.stringify($('#contrast').textContent));
click('[data-c="hex"]'); ok(clip==='#ff0000','copy HEX = '+clip);
click('[data-c="rgb"]'); ok(clip==='rgb(255, 0, 0)','copy RGB = '+clip);
click('[data-c="hsl"]'); ok(/hsl\(0, 100%, 50%\)/.test(clip),'copy HSL = '+clip);
const before=store.palette.length; $('#hexin').value='nothex'; click('#add'); await tick();
ok(store.palette.length===before,'invalid hex is rejected');
click('#pick'); await tick(); await tick();
ok((store.palette||[]).includes('#00ff00'),'eyedropper pick (page-injected) saves colour and survives popup close');
click('#export'); await tick();
ok(/#ff0000/.test(clip)&&/#00ff00/.test(clip),'export copies full palette as JSON');
click('#clear'); await tick();
ok((store.palette||[]).length===0 && $('#palette').children.length===0,'clear empties palette + UI');
console.log(fail?`\n❌ ${fail} TEST(S) FAILED`:'\n✅ ALL FUNCTIONAL TESTS PASSED — real popup.js executed end-to-end');
process.exit(fail?1:0);
