import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {once} from 'node:events';import fs from 'node:fs';
const screenDir=process.env.SCREENSHOT_DIR||'.local/screenshots';fs.mkdirSync(screenDir,{recursive:true});import assert from 'node:assert/strict';
const log=fs.openSync('/tmp/lbasy-cart-dev.log','a');const server=spawn('node',['node_modules/next/dist/bin/next','dev','--port','3102'],{stdio:['ignore',log,log]});const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(let i=0;i<90;i++){try{if((await fetch('http://localhost:3102/account')).ok)break;}catch{}await new Promise(r=>setTimeout(r,1000));}
 const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto('http://localhost:3102/shop');
 const product=await page.locator('a[href*="/product/"]').first().getAttribute('href');await page.goto('http://localhost:3102'+product);await page.waitForTimeout(600);
 await page.screenshot({path:`${screenDir}/lbasy-bag-before-add.png`});
 await page.locator('button').filter({hasText:'ضيف للشنطة'}).last().click();await page.waitForTimeout(300);
 assert.equal(await page.locator('.cart-count').innerText(),'1');await page.screenshot({path:`${screenDir}/lbasy-bag-after-add.png`});
 await page.reload();await page.waitForTimeout(500);assert.equal(await page.locator('.cart-count').innerText(),'1');
 const email='cart-flow-'+Date.now()+'@example.test';const password=crypto.randomUUID();
 const signup=await page.request.post('http://localhost:3102/api/backend/auth/signup',{headers:{Origin:'http://localhost:3102'},data:{name:'Cart Tester',email,password}});assert.equal(signup.status(),201);
 await page.goto('http://localhost:3102/account');await page.waitForTimeout(1000);
 const saved=await page.request.get('http://localhost:3102/api/backend/account/saved');assert.equal((await saved.json()).cart.length,1);
 await page.getByRole('button',{name:'خروج',exact:true}).click();await page.waitForTimeout(500);assert.equal(await page.locator('.cart-count').innerText(),'0');
 await page.locator('#email').fill(email);await page.locator('#password').fill(password);await page.getByRole('button',{name:'ادخل حسابك',exact:true}).click();await page.waitForTimeout(1000);assert.equal(await page.locator('.cart-count').innerText(),'1');
 await page.goto('http://localhost:3102/cart');await page.waitForTimeout(500);console.log('cart UI',await page.locator('main').innerText());
 await page.screenshot({path:`${screenDir}/lbasy-cart-synced-account.png`,fullPage:true});
 for(const lang of ['ar','en']) for(const width of [360,390,430]){
  await page.setViewportSize({width,height:844});await page.goto('http://localhost:3102'+(lang==='en'?'/en':'')+product);await page.waitForTimeout(250);
  const b=await page.locator('.cart-count').boundingBox();assert(b&&b.x>=0&&b.x+b.width<=width);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
 }
 console.log('PASS: instant guest count, reload persistence, local-to-account merge, signout clear, signin restoration, badge bounds in six locale/width combinations');
}finally{await browser.close();server.kill('SIGTERM');await once(server,'close');}
