import { chromium } from '@playwright/test';
import {spawn} from 'node:child_process';
import {once} from 'node:events';import fs from 'node:fs';
const screenDir=process.env.SCREENSHOT_DIR||'.local/screenshots';fs.mkdirSync(screenDir,{recursive:true});
const log=fs.openSync('/tmp/lbasy-account-dev.log','a');
const server=spawn('node',['node_modules/next/dist/bin/next','dev','--port','3102'],{cwd:process.cwd(),stdio:['ignore',log,log]});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(let i=0;i<90;i++){try{if((await fetch('http://localhost:3102/account')).ok)break;}catch{}await new Promise(r=>setTimeout(r,1000));}
 const page=await browser.newPage({viewport:{width:390,height:844}});
 page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
 for(const [lang,width] of [['ar',390],['en',390],['ar',1440],['en',1440]]){
  await page.setViewportSize({width,height:width>1000?1050:900});await page.goto('http://localhost:3102'+(lang==='en'?'/en':'')+'/account');await page.waitForTimeout(1700);
  console.log(lang,width,await page.evaluate(()=>({screen:innerWidth,page:document.documentElement.scrollWidth,errors:[...document.querySelectorAll('[role="alert"]')].map(e=>e.textContent)})));
  await page.screenshot({path:`${screenDir}/lbasy-account-${lang}-${width}.png`,fullPage:width<1000});
 }
 await page.setViewportSize({width:390,height:900});await page.goto('http://localhost:3102/account');await page.getByRole('button',{name:'حساب جديد',exact:true}).click();await page.screenshot({path:`${screenDir}/lbasy-signup-ar-390.png`,fullPage:true});
 await page.locator('#name').fill('Local Customer');await page.locator('#email').fill('visual-'+Date.now()+'@example.test');await page.locator('#password').fill(crypto.randomUUID()+'OnlyLocal!');await page.getByRole('button',{name:'اعمل حسابك',exact:true}).click();await page.waitForTimeout(1600);
 console.log('signup result',await page.locator('main').innerText());await page.screenshot({path:`${screenDir}/lbasy-account-signed-in-ar.png`,fullPage:true});
}finally{await browser.close();server.kill('SIGTERM');await once(server,'close');}
