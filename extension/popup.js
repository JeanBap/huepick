const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
let state={palettes:[{name:'My palette',colors:[]}],active:0},cur=null,sel=-1,pageColors=[];
const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
const norm=h=>{h=(h||'').trim();if(/^[0-9a-f]{6}$/i.test(h))h='#'+h;if(/^#[0-9a-f]{3}$/i.test(h))h='#'+h.slice(1).split('').map(c=>c+c).join('');return /^#[0-9a-f]{6}$/i.test(h)?h.toLowerCase():null;};
const hexToRgb=h=>{const n=parseInt(h.slice(1),16);return{r:(n>>16)&255,g:(n>>8)&255,b:n&255};};
const toHex=({r,g,b})=>'#'+[r,g,b].map(x=>clamp(x).toString(16).padStart(2,'0')).join('');
const toRgb=({r,g,b})=>`rgb(${r}, ${g}, ${b})`;
function toHsl({r,g,b}){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h,s,l=(mx+mn)/2;if(mx===mn){h=s=0;}else{const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6;}return `hsl(${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;}
const lum=({r,g,b})=>{const a=[r,g,b].map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;});return .2126*a[0]+.7152*a[1]+.0722*a[2];};
const ratio=(c,bg)=>{const x=lum(c),y=lum(bg),hi=Math.max(x,y),lo=Math.min(x,y);return (hi+.05)/(lo+.05);};
const WHITE={r:255,g:255,b:255},BLACK={r:0,g:0,b:0};
const CB={Prot:[.567,.433,0,.558,.442,0,0,.242,.758],Deut:[.625,.375,0,.7,.3,0,0,.3,.7],Trit:[.95,.05,0,0,.433,.567,0,.475,.525]};
const sim=(c,m)=>({r:clamp(m[0]*c.r+m[1]*c.g+m[2]*c.b),g:clamp(m[3]*c.r+m[4]*c.g+m[5]*c.b),b:clamp(m[6]*c.r+m[7]*c.g+m[8]*c.b)});
const pal=()=>state.palettes[state.active];
function load(cb){chrome.storage.local.get({palettes:null,palette:null,active:0},d=>{
  if(d.palettes&&d.palettes.length){state={palettes:d.palettes,active:Math.min(d.active||0,d.palettes.length-1)};}
  else if(d.palette&&d.palette.length){state={palettes:[{name:'My palette',colors:d.palette}],active:0};return save(()=>cb&&cb());}
  else{state={palettes:[{name:'My palette',colors:[]}],active:0};}
  cb&&cb();
});}
function save(cb){chrome.storage.local.set({palettes:state.palettes,active:state.active},cb);}
function toast(t){$('#toast').textContent=t;clearTimeout(window.__t);window.__t=setTimeout(()=>{$('#toast').textContent='';},1500);}
function renderSelect(){const s=$('#palsel');s.innerHTML='';state.palettes.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=p.name+' ('+p.colors.length+')';if(i===state.active)o.selected=true;s.appendChild(o);});}
function renderPalette(){const ul=$('#palette');ul.innerHTML='';pal().colors.forEach((hex,i)=>{const li=document.createElement('li');li.style.background=hex;li.title=hex;if(i===sel)li.className='sel';li.onclick=()=>{sel=i;show(hex);renderPalette();};ul.appendChild(li);});}
function badge(label,r){const aa=r>=4.5,aaa=r>=7;return `<div class="cline">${label} ${r.toFixed(2)}:1 <b class="${aa?'ok':'no'}">AA</b> <b class="${aaa?'ok':'no'}">AAA</b></div>`;}
function show(hex){cur=hexToRgb(hex);$('#current').hidden=false;$('#swatch').style.background=hex;$('#curhex').textContent=hex;
  $('#contrast').innerHTML=badge('On white',ratio(cur,WHITE))+badge('On black',ratio(cur,BLACK));
  $('#cb').innerHTML=['Prot','Deut','Trit'].map(k=>`<span class="cbsw" title="${k}" style="background:${toHex(sim(cur,CB[k]))}"></span>`).join('');}
function renderPage(){const w=$('#pagewrap'),ul=$('#pagecolors');if(!pageColors.length){w.hidden=true;return;}w.hidden=false;ul.innerHTML='';pageColors.forEach(hex=>{const li=document.createElement('li');li.style.background=hex;li.title=hex+' — click to add';li.onclick=()=>addColor(hex);ul.appendChild(li);});}
function renderAll(){renderSelect();renderPalette();}
function addColor(hex){const c=pal().colors;if(!c.includes(hex))c.push(hex);save(()=>{sel=c.indexOf(hex);show(hex);renderAll();});}
function addManual(){const h=norm($('#hexin').value);if(!h){toast('Enter a hex like #5b7cfa');return;}addColor(h);$('#hexin').value='';}
async function activeTab(){const[t]=await chrome.tabs.query({active:true,currentWindow:true});return t;}
const bad=u=>!u||/^(chrome|edge|about|chrome-extension|devtools|view-source):/.test(u)||/chromewebstore\.google/.test(u);
async function doPick(){try{const t=await activeTab();if(bad(t.url)){toast('Open a normal web page, then Pick');return;}
  const[res]=await chrome.scripting.executeScript({target:{tabId:t.id},args:[state.active],func:async(active)=>{
    if(!window.EyeDropper)return{err:'unsupported'};
    try{const{sRGBHex}=await new window.EyeDropper().open();const d=await chrome.storage.local.get({palettes:[{name:'My palette',colors:[]}],active:0});const ps=d.palettes;const i=Math.min(active,ps.length-1);if(!ps[i].colors.includes(sRGBHex))ps[i].colors.push(sRGBHex);await chrome.storage.local.set({palettes:ps});return{hex:sRGBHex};}catch(e){return{err:'cancel'};}}});
  const r=res&&res.result;if(r&&r.hex)load(()=>{sel=pal().colors.indexOf(r.hex);show(r.hex);renderAll();});else if(r&&r.err==='unsupported')toast('EyeDropper unsupported on this Chrome');
}catch(e){toast('Cannot pick on this page');}}
async function doScan(){if(!pro){needPro("Page scan");return;}try{const t=await activeTab();if(bad(t.url)){toast('Open a web page to scan');return;}
  const[res]=await chrome.scripting.executeScript({target:{tabId:t.id},func:()=>{
    const seen={};const add=c=>{if(!c)return;const m=String(c).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/i);if(!m)return;if(m[4]!==undefined&&parseFloat(m[4])===0)return;const hex='#'+[m[1],m[2],m[3]].map(x=>(+x).toString(16).padStart(2,'0')).join('');seen[hex]=(seen[hex]||0)+1;};
    let n=0;for(const el of document.querySelectorAll('body *')){if(n++>5000)break;const r=el.getBoundingClientRect();if(r.width<2||r.height<2)continue;const cs=getComputedStyle(el);add(cs.color);add(cs.backgroundColor);add(cs.borderTopColor);add(cs.fill);add(cs.stroke);}
    return Object.entries(seen).sort((a,b)=>b[1]-a[1]).slice(0,30).map(e=>e[0]);}});
  pageColors=(res&&res.result)||[];renderPage();toast(pageColors.length+' colours found');
}catch(e){toast('Cannot scan this page');}}
const FMT={'CSS variables':c=>':root{\n'+c.map((h,i)=>`  --color-${i+1}: ${h};`).join('\n')+'\n}','Tailwind':c=>'colors: {\n'+c.map((h,i)=>`  'brand-${i+1}': '${h}',`).join('\n')+'\n}','JSON':c=>JSON.stringify(c,null,2),'List':c=>c.join('\n')};
$('#add').onclick=addManual;$('#hexin').addEventListener('keydown',e=>{if(e.key==='Enter')addManual();});
$('#pick').onclick=doPick;$('#scan').onclick=doScan;
$$('.code').forEach(b=>b.onclick=()=>{if(!cur)return;const v=b.dataset.c==='hex'?toHex(cur):b.dataset.c==='rgb'?toRgb(cur):toHsl(cur);if(navigator.clipboard)navigator.clipboard.writeText(v);toast('Copied '+v);});
$('#export').onclick=()=>{$('#exportmenu').hidden=!$('#exportmenu').hidden;};
$$('#exportmenu button').forEach(b=>b.onclick=()=>{if(!pro){needPro('Export');return;}const out=FMT[b.dataset.f](pal().colors);if(navigator.clipboard)navigator.clipboard.writeText(out);$('#exportmenu').hidden=true;toast('Copied as '+b.dataset.f);});
$('#palsel').onchange=e=>{state.active=+e.target.value;sel=-1;$('#current').hidden=true;save(()=>renderAll());};
$('#newpal').onclick=()=>{if(!pro&&state.palettes.length>=1){needPro('Multiple palettes');return;}const n=prompt('New palette name','Palette '+(state.palettes.length+1));if(!n)return;state.palettes.push({name:n,colors:[]});state.active=state.palettes.length-1;sel=-1;$('#current').hidden=true;save(()=>renderAll());};
$('#renpal').onclick=()=>{const n=prompt('Rename palette',pal().name);if(!n)return;pal().name=n;save(()=>renderSelect());};
$('#delpal').onclick=()=>{if(state.palettes.length<=1)pal().colors=[];else{state.palettes.splice(state.active,1);state.active=0;}sel=-1;$('#current').hidden=true;save(()=>renderAll());};
$('#rmcolor').onclick=()=>{if(sel<0)return;pal().colors.splice(sel,1);sel=-1;$('#current').hidden=true;save(()=>renderAll());};
$('#movel').onclick=()=>{if(sel<=0)return;const c=pal().colors;[c[sel-1],c[sel]]=[c[sel],c[sel-1]];sel--;save(()=>renderPalette());};
$('#mover').onclick=()=>{const c=pal().colors;if(sel<0||sel>=c.length-1)return;[c[sel+1],c[sel]]=[c[sel],c[sel+1]];sel++;save(()=>renderPalette());};
chrome.storage.onChanged.addListener((ch,a)=>{if(a==='local'&&(ch.palettes||ch.palette))load(()=>renderAll());});
let pro=false,extpay=null;
try{extpay=ExtPay('huepick');}catch(e){}
function renderProUI(){const u=document.querySelector('#upgrade');if(u)u.hidden=pro;document.body.classList.toggle('is-pro',pro);}
function needPro(f){toast(f+' is Pro \u2014 opening checkout');if(extpay&&extpay.openPaymentPage)extpay.openPaymentPage();}
function refreshPro(){if(!extpay)return renderProUI();extpay.getUser().then(u=>{pro=!!(u&&u.paid);renderProUI();}).catch(()=>renderProUI());}
if(extpay&&extpay.onPaid&&extpay.onPaid.addListener)extpay.onPaid.addListener(()=>{pro=true;renderProUI();});
{const _u=document.querySelector('#upgrade');if(_u)_u.onclick=()=>{if(extpay)extpay.openPaymentPage();};}
refreshPro();
load(()=>renderAll());
