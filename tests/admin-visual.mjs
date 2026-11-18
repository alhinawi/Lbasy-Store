import {chromium} from '@playwright/test';import {spawn,execFileSync} from 'node:child_process';import {once} from 'node:events';import fs from 'node:fs';import assert from 'node:assert/strict';
const dir=process.env.SCREENSHOT_DIR||'.local/screenshots';fs.mkdirSync(dir,{recursive:true});const log=fs.openSync('/tmp/lbasy-admin-visual.log','a');const child=spawn('node',['node_modules/next/dist/bin/next','dev','--port','3105'],{stdio:['ignore',log,log]});const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(let i=0;i<90;i++){try{if((await fetch('http://localhost:3105/account')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));}
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const email='admin-local-'+Date.now()+'@example.test';
 const r=await page.request.post('http://localhost:3105/api/backend/auth/signup',{headers:{Origin:'http://localhost:3105'},data:{email,password:crypto.randomUUID(),name:'Local Admin'}});assert.equal(r.status(),201);
 execFileSync('node',['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--command',`UPDATE users SET role='admin' WHERE email='${email}'`],{stdio:'pipe'});
 await page.goto('http://localhost:3105/admin');await page.getByRole('button',{name:'القطع',exact:true}).first().click();await page.waitForTimeout(1000);
 await page.screenshot({path:dir+'/lbasy-admin-inventory-desktop.png'});
 const confirmButtons=page.getByRole('button',{name:'تأكيد المخزون الحقيقي قبل الطلب',exact:true});assert(await confirmButtons.count()>0);
 const list=await page.request.get('http://localhost:3105/api/backend/admin/products');const p=(await list.json()).items[0];
 const confirm=await page.request.patch(`http://localhost:3105/api/backend/admin/products/${p.id}/inventory`,{headers:{Origin:'http://localhost:3105'},data:{confirmed:true,revision:p._revision}});assert.equal(confirm.status(),200);
 await page.reload();await page.getByRole('button',{name:'القطع',exact:true}).first().click();await page.waitForTimeout(500);
 await page.setViewportSize({width:390,height:900});await page.screenshot({path:dir+'/lbasy-admin-inventory-mobile.png'});
 console.log('PASS local admin account, persistent product list, explicit inventory confirmation and mobile/desktop screenshots');
}finally{await browser.close();child.kill('SIGTERM');await once(child,'close');}
