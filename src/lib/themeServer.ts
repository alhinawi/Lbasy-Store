import 'server-only';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { connection } from 'next/server';
import { DEFAULT_THEME, isTheme, type ThemeId } from './themes';
export interface ThemeKV { delete(key:string):Promise<void>; get(key:string):Promise<string|null>; put(key:string,value:string,options?:{expirationTtl:number}):Promise<void>; }
export async function themeEnv(): Promise<{THEMES?:ThemeKV; SESSION_SECRET?:string}> {
 try { return (await getCloudflareContext({async:true})).env as unknown as {THEMES?:ThemeKV; SESSION_SECRET?:string}; }
 catch {return {SESSION_SECRET:process.env.SESSION_SECRET};}
}
export async function getStoreTheme():Promise<ThemeId> {
 await connection();
 try {const e=await themeEnv();const id=await e.THEMES?.get('active-theme');return isTheme(id)?id:DEFAULT_THEME;}catch{return DEFAULT_THEME;}
}
const encoder=new TextEncoder();
async function digest(value:string){return new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)));}
export async function equalSecret(a:string,b:string){const [x,y]=await Promise.all([digest(a),digest(b)]);let d=0;for(let i=0;i<x.length;i++)d|=x[i]^y[i];return d===0;}
async function signature(value:string,secret:string){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const out=await crypto.subtle.sign('HMAC',key,encoder.encode(value));return Array.from(new Uint8Array(out)).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function createSession(secret:string){const expiry=String(Date.now()+8*60*60*1000);return `${expiry}.${await signature(expiry,secret)}`;}
export async function validSession(cookie:string|undefined,secret:string|undefined){if(!cookie||!secret)return false;const [expires,sig]=cookie.split('.');if(!expires||!sig||Number(expires)<Date.now()||Number(expires)>Date.now()+9*60*60*1000)return false;return equalSecret(sig,await signature(expires,secret));}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !!origin&&origin===new URL(req.url).origin;}
