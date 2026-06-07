import { JSDOM } from 'jsdom'; import fs from 'fs'; import path from 'path';
const EXT=process.env.EXT||path.resolve('../extension');
const html=fs.readFileSync(path.join(EXT,'popup.html'),'utf8');
const js=fs.readFileSync(path.join(EXT,'popup.js'),'utf8');
let fail=0; const ok=(c,m)=>{console.log((c?'PASS ✓':'FAIL ✗')+'  '+m); if(!c)fail++;};
const store={palette:['#aabbcc']}; const listeners=[]; let clip='';
const fire=obj=>{const ch={};for(const k in obj)ch[k]={newValue:obj[k]};listeners.forEach(l=>l(ch,'local'));};
const merged=def=>{const o={};for(const k in def)o[k]=(k in store)?store[k]:def[k];return o;};
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true});
const {window}=dom;
window.chrome={
  storage:{local:{
    get:(def,cb)=>cb(merged(def)),
    set:(obj,cb)=>{Object.assign(store,obj);cb&&cb();fire(obj);}
  },onChanged:{addListener:l=>listeners.push(l)}},
  tabs:{query:async()=>[{id:1,url:'https://example.com'}]},
  scripting:{executeScript:async({func,args})=>{
    const src=func.toString();
    if(src.includes('EyeDropper')){
      const w={EyeDropper:class{async open(){return{sRGBHex:'#123456'};}}};
      const ch={storage:{local:{get:def=>Promise.resolve(merged(def)),set:o=>{Object.assign(store,o);fire(o);return Promise.resolve();}}}};
      const run=new Function('window','chrome','args','return ('+src+').apply(null,args||[]);');
      return [{result:await run(w,ch,args)}];
    }
    if(src.includes('getBoundingClientRect')){
      const pd=new JSDOM('<body><div data-col="rgb(17, 34, 51)" data-bg="rgb(255, 255, 255)"></div><p data-col="rgb(68, 85, 102)" data-bg="rgba(0, 0, 0, 0)"></p></body>');
      pd.window.Element.prototype.getBoundingClientRect=()=>({width:10,height:10,top:0,left:0,right:10,bottom:10});
      const gcs=el=>({color:el.dataset.col||'',backgroundColor:el.dataset.bg||'',borderTopColor:'',fill:'',stroke:''});
      const run=new Function('window','document','getComputedStyle','return ('+src+')();');
      return [{result:run(pd.window,pd.window.document,gcs)}];
    }
    return [{result:null}];
  }}
};
window.EyeDropper=undefined;
window.navigator.clipboard={writeText:t=>{clip=t;return Promise.resolve();}};
let promptVal='X'; window.prompt=()=>promptVal;
window.eval(js);
const $=s=>window.document.querySelector(s);
const click=s=>$(s).dispatchEvent(new window.Event('click'));
const tick=()=>new Promise(r=>setTimeout(r,0));
await tick();
// 1 migration
ok(store.palettes&&store.palettes[0].colors[0]==='#aabbcc','migrates v1 palette -> named palette');
// 2 manual add
$('#hexin').value='#ff0000'; click('#add'); await tick();
ok(store.palettes[0].colors.includes('#ff0000'),'manual add into active palette');
ok($('#palette').children.length===2,'palette grid shows 2 colours');
// 3 contrast badges + colourblind
ok(/AA/.test($('#contrast').innerHTML)&&/AAA/.test($('#contrast').innerHTML),'WCAG AA/AAA badges shown');
ok($('#cb').children.length===3,'3 colour-blind preview swatches');
// 4 copy formats
click('[data-c="hex"]'); ok(clip==='#ff0000','copy HEX');
click('[data-c="rgb"]'); ok(clip==='rgb(255, 0, 0)','copy RGB');
click('[data-c="hsl"]'); ok(/hsl\(0, 100%, 50%\)/.test(clip),'copy HSL');
// 5 export formats
click('#export');
$('[data-f="CSS variables"]').dispatchEvent(new window.Event('click'));
ok(/:root\{/.test(clip)&&/--color-1: #aabbcc;/.test(clip),'export CSS variables');
click('#export');
$('[data-f="Tailwind"]').dispatchEvent(new window.Event('click'));
ok(/colors: \{/.test(clip)&&/'brand-1': '#aabbcc'/.test(clip),'export Tailwind');
// 6 named palettes: new + add isolates
promptVal='Brand'; click('#newpal'); await tick();
ok(store.palettes.length===2&&store.palettes[1].name==='Brand'&&store.active===1,'create + switch to named palette');
$('#hexin').value='#00ff00'; click('#add'); await tick();
ok(store.palettes[1].colors.includes('#00ff00')&&!store.palettes[0].colors.includes('#00ff00'),'colours isolated per palette');
// 7 switch back via select
$('#palsel').value='0'; $('#palsel').dispatchEvent(new window.Event('change')); await tick();
ok(store.active===0&&$('#palette').children.length===2,'switch active palette via dropdown');
// 8 page scan + add
click('#scan'); await tick(); await tick();
const pc=$('#pagecolors').children.length;
ok(pc>=2,'page scan found colours ('+pc+')');
$('#pagecolors').children[0].dispatchEvent(new window.Event('click')); await tick();
ok(store.palettes[0].colors.length===3,'click a page colour adds it to palette');
// 9 select + remove
$('#palette').children[0].dispatchEvent(new window.Event('click')); await tick();
const lenBefore=store.palettes[0].colors.length;
click('#rmcolor'); await tick();
ok(store.palettes[0].colors.length===lenBefore-1,'remove selected colour');
// 10 eyedropper pick path saves into active palette
click('#pick'); await tick(); await tick();
ok(store.palettes[0].colors.includes('#123456'),'eyedropper pick saves into active palette (survives popup close)');
console.log(fail?`\n❌ ${fail} FAILED`:'\n✅ ALL v2 TESTS PASSED — real popup.js executed end-to-end');
process.exit(fail?1:0);
