import {chromium} from '@playwright/test';import {spawn} from 'node:child_process';import {once} from 'node:events';import fs from 'node:fs';import assert from 'node:assert/strict';
const dir=process.env.SCREENSHOT_DIR||'.local/screenshots';fs.mkdirSync(dir,{recursive:true});const log=fs.openSync('/tmp/lbasy-carousel.log','a');const child=spawn('node',['node_modules/next/dist/bin/next','dev','--port','3106'],{stdio:['ignore',log,log]});const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(let i=0;i<90;i++){try{if((await fetch('http://localhost:3106/shop')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));}
 for(const lang of ['ar','en']){
  const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await ctx.newPage();await page.goto('http://localhost:3106'+(lang==='en'?'/en':'')+'/shop');await page.waitForTimeout(650);
  const card=page.locator('.card-carousel').first();const track=card.locator('.card-carousel-track');if(await track.locator('a').count()===1){
   assert.equal(await card.locator('.card-carousel-dots').count(),0);assert.equal(await card.locator('.card-carousel-arrow').count(),0);
   await page.screenshot({path:dir+`/lbasy-current-catalog-${lang}-mobile.png`});
   console.log('PASS',lang,'single genuine photo has no fabricated alternate views');await ctx.close();continue;
  }
  await card.getByRole('button',{name:(lang==='ar'?'صورة':'Photo')+' 2',exact:true}).click();await page.waitForTimeout(450);
  assert.equal(await card.getByRole('button',{name:(lang==='ar'?'صورة':'Photo')+' 2',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(new URL(page.url()).pathname,lang==='en'?'/en/shop':'/shop');
  await page.screenshot({path:dir+`/lbasy-card-carousel-${lang}-mobile.png`});
  const box=await track.boundingBox();const x=box.x+box.width/2,y=box.y+box.height/2;const cdp=await ctx.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(lang==='ar'?1:-1)*i*box.width*.06,y}]});await page.waitForTimeout(20);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(1000);
  const idx=await card.locator('.card-carousel-dots .active').getAttribute('aria-label');console.log(lang,'after swipe',idx);assert.notEqual(idx,(lang==='ar'?'صورة':'Photo')+' 2');assert.equal(new URL(page.url()).pathname,lang==='en'?'/en/shop':'/shop');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
  await page.locator('.fashion-product-card').first().getByRole('button',{name:lang==='ar'?'المفضلة':'Favorites',exact:true}).click();
  assert.equal(new URL(page.url()).pathname,lang==='en'?'/en/shop':'/shop');
  await page.goto('http://localhost:3106'+(lang==='en'?'/en':'')+'/favorites');await page.waitForTimeout(500);
  assert(await page.locator('.card-carousel-slide').count()>1);await page.screenshot({path:dir+`/lbasy-favorites-carousel-${lang}.png`});
  for(const width of [360,430]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);}
  await ctx.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto('http://localhost:3106/en/shop');const first=page.locator('.card-carousel').first();await first.hover();if(await first.locator('.card-carousel-slide').count()>1){await first.getByRole('button',{name:'Next photo',exact:true}).click();await page.waitForTimeout(500);assert.equal(await first.getByRole('button',{name:'Photo 2',exact:true}).getAttribute('aria-pressed'),'true');}await page.screenshot({path:dir+'/lbasy-card-carousel-desktop.png'});
 console.log('PASS carousel dots, native touch swipe, no unintended navigation, desktop arrow and mobile page width, Arabic/English');
}finally{await browser.close();child.kill('SIGTERM');await once(child,'close');}
