import { chromium } from '@playwright/test';
import {spawn} from 'node:child_process';
import {once} from 'node:events';import fs from 'node:fs';
const screenDir=process.env.SCREENSHOT_DIR||'.local/screenshots';fs.mkdirSync(screenDir,{recursive:true});
const server=spawn('node',['node_modules/next/dist/bin/next','dev','--port','3101'],{cwd:process.cwd(),stdio:['ignore',fs.openSync('/tmp/lbasy-fix-dev.log','a'),fs.openSync('/tmp/lbasy-fix-dev.log','a')]});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(let i=0;i<120;i++){try{if((await fetch('http://localhost:3101/shop')).ok)break;}catch{}await new Promise(r=>setTimeout(r,1000));}
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('http://localhost:3101/shop'); await page.waitForTimeout(1000);
 const product=await page.locator('a[href*="/product/"]').first().getAttribute('href');
 const paths=[product, '/en'+product.replace(/^\/ar/,'')];
 for(const width of [360,390,430]) for(const path of paths){
  await page.setViewportSize({width,height:844});await page.goto('http://localhost:3101'+path); await page.waitForTimeout(1200);
  const state=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>innerWidth+1&&getComputedStyle(e).position!=='absolute'}).slice(0,10).map(e=>({tag:e.tagName,cl:e.className,width:e.getBoundingClientRect().width}))}));console.log(path,width,JSON.stringify(state));
  const lang=path.startsWith('/en')?'en':'ar';await page.screenshot({path:`${screenDir}/lbasy-product-${lang}-${width}-${process.env.PHASE||'before'}.png`});
 }
}finally{await browser.close();server.kill('SIGTERM');await once(server,'close');}
