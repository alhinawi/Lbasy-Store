// Run after pages:build, db:migrate:local and db:seed:local. Never touches remote D1.
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('.local',{recursive:true});
const slug=process.env.TEST_PRODUCT_SLUG||'carhartt-detroit-jacket-brown';
for(const mode of ['next','pages']){
 const port=mode==='next'?3107:3108;
 const args=mode==='next'?['node_modules/next/dist/bin/next','start','--port',String(port)]:['node_modules/wrangler/bin/wrangler.js','pages','dev','--cwd','cloudflare','--port',String(port),'--persist-to',process.cwd()+'/.wrangler/state'];
 const log=fs.openSync(`.local/product-${mode}.log`,'a');
 const server=spawn('node',args,{stdio:['ignore',log,log]});
 try{
  let ready=false;
  for(let i=0;i<90;i++){try{const r=await fetch(`http://localhost:${port}/`);if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
  assert(ready,mode+' started');
  for(const path of ['/product/'+slug,'/en/product/'+slug]){
   const r=await fetch(`http://localhost:${port}`+path);const text=await r.text();
   assert.equal(r.status,200,mode+' '+path);assert(text.includes(slug),'product rendered');
   console.log('PASS',mode,path,r.status);
  }
 }finally{server.kill('SIGTERM');await once(server,'close');}
}
