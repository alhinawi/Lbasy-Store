import 'server-only';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { connection } from 'next/server';
import { DEFAULT_THEME, isTheme, rotationTheme, type ThemeRotation, type ThemeId } from './themes';
export interface ThemeKV { delete(key:string):Promise<void>; get(key:string):Promise<string|null>; put(key:string,value:string,options?:{expirationTtl:number}):Promise<void>; }
export async function themeEnv(): Promise<{THEMES?:ThemeKV; SESSION_SECRET?:string}> {
 try { return (await getCloudflareContext({async:true})).env as unknown as {THEMES?:ThemeKV; SESSION_SECRET?:string}; }
 catch {return {SESSION_SECRET:process.env.SESSION_SECRET};}
}
export async function getThemeState() {
 const e=await themeEnv();
 const [saved, raw]=await Promise.all([e.THEMES?.get('active-theme'),e.THEMES?.get('theme-rotation')]);
 let rotation: ThemeRotation = {enabled:false,intervalMinutes:1440,startedAt:Date.now(),startTheme:isTheme(saved)?saved:DEFAULT_THEME};
 try {const r=JSON.parse(raw||'null');if(r&&typeof r.enabled==='boolean'&&Number.isFinite(r.intervalMinutes)&&r.intervalMinutes>=1&&Number.isFinite(r.startedAt)&&isTheme(r.startTheme))rotation=r;} catch {}
 const theme=rotation.enabled?rotationTheme(rotation):(isTheme(saved)?saved:DEFAULT_THEME);
 const nextChangeAt=rotation.enabled?rotation.startedAt+(Math.floor(Math.max(0,Date.now()-rotation.startedAt)/(rotation.intervalMinutes*60000))+1)*rotation.intervalMinutes*60000:null;
 return {theme,rotation,nextChangeAt,shared:!!e.THEMES,publishReady:!!(e.THEMES&&e.SESSION_SECRET)};
}
export async function getStoreTheme():Promise<ThemeId> {
 await connection();
 try {return (await getThemeState()).theme;}catch{return DEFAULT_THEME;}
}
const encoder=new TextEncoder();
async function digest(value:string){return new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)));}
export async function equalSecret(a:string,b:string){const [x,y]=await Promise.all([digest(a),digest(b)]);let d=0;for(let i=0;i<x.length;i++)d|=x[i]^y[i];return d===0;}
async function signature(value:string,secret:string){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const out=await crypto.subtle.sign('HMAC',key,encoder.encode(value));return Array.from(new Uint8Array(out)).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function createSession(secret:string){const expiry=String(Date.now()+8*60*60*1000);return `${expiry}.${await signature(expiry,secret)}`;}
export async function validSession(cookie:string|undefined,secret:string|undefined){if(!cookie||!secret)return false;const [expires,sig]=cookie.split('.');if(!expires||!sig||Number(expires)<Date.now()||Number(expires)>Date.now()+9*60*60*1000)return false;return equalSecret(sig,await signature(expires,secret));}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !!origin&&origin===new URL(req.url).origin;}
