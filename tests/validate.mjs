import fs from 'fs'; import path from 'path';
const EXT=process.env.EXT||path.resolve('../extension'); let fail=0;
const ok=(c,m)=>{console.log((c?'PASS':'FAIL')+'  '+m); if(!c)fail++;};
const m=JSON.parse(fs.readFileSync(path.join(EXT,'manifest.json')));
ok(m.manifest_version===3,'manifest is MV3');
ok(!!m.action?.default_popup,'has popup');
for(const f of [m.action.default_popup, m.background?.service_worker, ...Object.values(m.icons)].filter(Boolean))
  ok(fs.existsSync(path.join(EXT,f)),'file exists: '+f);
for(const sz of ['16','48','128']){const b=fs.readFileSync(path.join(EXT,m.icons[sz]));ok(b.slice(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])),'icon'+sz+' is real PNG');}
console.log(fail?`\n${fail} STATIC CHECK(S) FAILED`:'\nSTATIC CHECKS PASSED'); process.exit(fail?1:0);
