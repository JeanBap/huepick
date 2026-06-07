const $=s=>document.querySelector(s);let cur=null;
const toHex=({r,g,b})=>'#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
const toRgb=({r,g,b})=>`rgb(${r}, ${g}, ${b})`;
function toHsl({r,g,b}){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h,s,l=(mx+mn)/2;if(mx===mn){h=s=0}else{const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6}return `hsl(${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`}
const lum=({r,g,b})=>{const a=[r,g,b].map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*a[0]+.7152*a[1]+.0722*a[2]};
const contrast=c=>{const L=lum(c);const cw=(Math.max(L,1)+.05)/(Math.min(L,0)+.05);const cb=(Math.max(L,0)+.05)/(Math.min(L,0)+.05);return {white:((1.05)/(L+.05)).toFixed(2),black:((L+.05)/.05).toFixed(2)}};
function hexToRgb(h){const n=parseInt(h.slice(1),16);return{r:(n>>16)&255,g:(n>>8)&255,b:n&255}}
function render(){chrome.storage.local.get({palette:[]},({palette})=>{const ul=$('#palette');ul.innerHTML='';palette.slice(-24).reverse().forEach(hex=>{const li=document.createElement('li');li.style.background=hex;li.title=hex;li.onclick=()=>show(hexToRgb(hex));ul.appendChild(li)})})}
function show(c){cur=c;$('#current').hidden=false;$('#swatch').style.background=toHex(c);const ct=contrast(c);$('#contrast').textContent=`Contrast vs white ${ct.white}:1 · vs black ${ct.black}:1`}
function toast(t){$('#toast').textContent=t;setTimeout(()=>$('#toast').textContent='',1200)}
$('#pick').onclick=async()=>{if(!window.EyeDropper){toast('EyeDropper unsupported');return}try{const{sRGBHex}=await new EyeDropper().open();const c=hexToRgb(sRGBHex);show(c);chrome.storage.local.get({palette:[]},({palette})=>{palette.push(sRGBHex);chrome.storage.local.set({palette},render)})}catch(e){}};
document.querySelectorAll('.code').forEach(b=>b.onclick=()=>{if(!cur)return;const v=b.dataset.c==='hex'?toHex(cur):b.dataset.c==='rgb'?toRgb(cur):toHsl(cur);navigator.clipboard.writeText(v);toast('Copied '+v)});
$('#clear').onclick=()=>chrome.storage.local.set({palette:[]},render);
$('#export').onclick=()=>chrome.storage.local.get({palette:[]},({palette})=>{navigator.clipboard.writeText(JSON.stringify(palette,null,2));toast('Palette copied as JSON')});
render();