const $=s=>document.querySelector(s);let cur=null;
const clamp=v=>Math.max(0,Math.min(255,v|0));
const norm=h=>{h=(h||'').trim();if(/^[0-9a-f]{6}$/i.test(h))h='#'+h;if(/^#[0-9a-f]{3}$/i.test(h))h='#'+h.slice(1).split('').map(c=>c+c).join('');return /^#[0-9a-f]{6}$/i.test(h)?h.toLowerCase():null;};
const hexToRgb=h=>{const n=parseInt(h.slice(1),16);return{r:(n>>16)&255,g:(n>>8)&255,b:n&255};};
const toHex=({r,g,b})=>'#'+[r,g,b].map(x=>clamp(x).toString(16).padStart(2,'0')).join('');
const toRgb=({r,g,b})=>`rgb(${r}, ${g}, ${b})`;
function toHsl({r,g,b}){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h,s,l=(mx+mn)/2;if(mx===mn){h=s=0;}else{const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6;}return `hsl(${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;}
const lum=({r,g,b})=>{const a=[r,g,b].map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;});return .2126*a[0]+.7152*a[1]+.0722*a[2];};
const contrast=c=>{const L=lum(c);return{white:(1.05/(L+.05)).toFixed(2),black:((L+.05)/.05).toFixed(2)};};
function show(hex){cur=hexToRgb(hex);$('#current').hidden=false;$('#swatch').style.background=hex;const ct=contrast(cur);$('#contrast').textContent=`Contrast — white ${ct.white}:1 · black ${ct.black}:1`;}
function render(){chrome.storage.local.get({palette:[]},({palette})=>{const ul=$('#palette');ul.innerHTML='';palette.slice(-32).reverse().forEach(hex=>{const li=document.createElement('li');li.style.background=hex;li.title=hex;li.onclick=()=>show(hex);ul.appendChild(li);});if(palette.length)show(palette[palette.length-1]);});}
function save(hex){chrome.storage.local.get({palette:[]},({palette})=>{palette.push(hex);chrome.storage.local.set({palette});});}
function toast(t){$('#toast').textContent=t;setTimeout(()=>{$('#toast').textContent='';},1400);}
function addManual(){const h=norm($('#hexin').value);if(!h){toast('Enter a hex like #5b7cfa');return;}save(h);show(h);$('#hexin').value='';}
$('#add').onclick=addManual;
$('#hexin').addEventListener('keydown',e=>{if(e.key==='Enter')addManual();});
$('#pick').onclick=async()=>{
  try{
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(!tab||/^(chrome|edge|about|chrome-extension|devtools):/.test(tab.url||'')||/chromewebstore\.google/.test(tab.url||'')){toast('Open a normal web page, then Pick');return;}
    const [res]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:async()=>{
      if(!window.EyeDropper)return{err:'unsupported'};
      try{const{sRGBHex}=await new window.EyeDropper().open();const cur=(await chrome.storage.local.get({palette:[]})).palette;cur.push(sRGBHex);await chrome.storage.local.set({palette:cur});return{hex:sRGBHex};}catch(e){return{err:'cancel'};}
    }});
    const r=res&&res.result;
    if(r&&r.hex)show(r.hex);
    else if(r&&r.err==='unsupported')toast('EyeDropper unsupported on this Chrome');
  }catch(e){toast('Cannot pick on this page');}
};
document.querySelectorAll('.code').forEach(b=>b.onclick=()=>{if(!cur)return;const v=b.dataset.c==='hex'?toHex(cur):b.dataset.c==='rgb'?toRgb(cur):toHsl(cur);if(navigator.clipboard)navigator.clipboard.writeText(v);toast('Copied '+v);});
$('#clear').onclick=()=>chrome.storage.local.set({palette:[]},()=>{$('#current').hidden=true;render();});
$('#export').onclick=()=>chrome.storage.local.get({palette:[]},({palette})=>{if(navigator.clipboard)navigator.clipboard.writeText(JSON.stringify(palette,null,2));toast('Palette copied as JSON');});
chrome.storage.onChanged.addListener((ch,area)=>{if(area==='local'&&ch.palette)render();});
render();
