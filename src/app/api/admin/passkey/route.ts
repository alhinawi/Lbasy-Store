import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server';
import { createSession, equalSecret, sameOrigin, themeEnv, validSession } from '@/lib/themeServer';
export const dynamic='force-dynamic';
type SavedKey={id:string;publicKey:number[];counter:number;transports?:string[]};
const fail=(error:string,status=400)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return fail('origin',403);
 const env=await themeEnv();if(!env.THEMES||!env.SESSION_SECRET)return fail('not_configured',503);const kv=env.THEMES;
 const url=new URL(req.url);const rpID=url.hostname;const origin=url.origin;
 if(rpID!=='lbasy.pages.dev'&&rpID!=='localhost'&&!rpID.endsWith('.lbasy.pages.dev'))return fail('hostname',403);
 let body;try{body=await req.json();}catch{return fail('invalid');}
 const savedRaw=await kv.get('admin-passkey');const saved:SavedKey|null=savedRaw?JSON.parse(savedRaw):null;
 try{
 if(body.action==='register-options'){
  const authenticated=await validSession(req.cookies.get('lbasy-admin')?.value,env.SESSION_SECRET);
  if(saved&&!authenticated)return fail('already_registered',403);
  if(!authenticated){
   const ip=req.headers.get('cf-connecting-ip')||'local';const bucket=`enroll-attempts:${ip}:${Math.floor(Date.now()/900000)}`;const attempts=Number(await kv.get(bucket)||0);if(attempts>=10)return fail('too_many_attempts',429);
   const code=await kv.get('enrollment-code');if(!code||typeof body.code!=='string'||!await equalSecret(body.code,code)){await kv.put(bucket,String(attempts+1),{expirationTtl:1800});return fail('invalid_or_expired_code',401);}
   await kv.delete('enrollment-code');
  }
  const options=await generateRegistrationOptions({rpName:'LBASY Admin',rpID,userName:'LBASY owner',userDisplayName:'LBASY owner',attestationType:'none',supportedAlgorithmIDs:[-7,-257],authenticatorSelection:{residentKey:'required',userVerification:'required'},excludeCredentials:saved?[{id:saved.id}]:[]});
  const id=crypto.randomUUID();await kv.put('webauthn:'+id,JSON.stringify({challenge:options.challenge,type:'register',origin,rpID}),{expirationTtl:300});const r=NextResponse.json(options);r.cookies.set('lbasy-webauthn',id,{httpOnly:true,secure:url.protocol==='https:',sameSite:'strict',path:'/',maxAge:300});r.headers.set('Cache-Control','no-store');return r;
 }
 if(body.action==='login-options'){
  if(!saved)return fail('not_registered',404);
  const options=await generateAuthenticationOptions({rpID,userVerification:'required',allowCredentials:[{id:saved.id,transports:saved.transports}]});const id=crypto.randomUUID();await kv.put('webauthn:'+id,JSON.stringify({challenge:options.challenge,type:'login',origin,rpID}),{expirationTtl:300});const r=NextResponse.json(options);r.cookies.set('lbasy-webauthn',id,{httpOnly:true,secure:url.protocol==='https:',sameSite:'strict',path:'/',maxAge:300});r.headers.set('Cache-Control','no-store');return r;
 }
 if(body.action==='register-verify'||body.action==='login-verify'){
  const id=req.cookies.get('lbasy-webauthn')?.value;if(!id)return fail('challenge_expired',401);const raw=await kv.get('webauthn:'+id);if(!raw)return fail('challenge_expired',401);const challenge=JSON.parse(raw);await kv.delete('webauthn:'+id);
  if(challenge.origin!==origin||challenge.rpID!==rpID)return fail('origin',403);
  if(body.action==='register-verify'){
   if(challenge.type!=='register')return fail('invalid_challenge');
   const verification=await verifyRegistrationResponse({response:body.response as RegistrationResponseJSON,expectedChallenge:challenge.challenge,expectedOrigin:origin,expectedRPID:rpID,requireUserVerification:true});if(!verification.verified||!verification.registrationInfo)return fail('verification_failed',401);const {credential}=verification.registrationInfo;await kv.put('admin-passkey',JSON.stringify({id:credential.id,publicKey:Array.from(credential.publicKey),counter:credential.counter,transports:credential.transports}));
  }else{
   if(challenge.type!=='login'||!saved)return fail('invalid_challenge');const verification=await verifyAuthenticationResponse({response:body.response as AuthenticationResponseJSON,expectedChallenge:challenge.challenge,expectedOrigin:origin,expectedRPID:rpID,requireUserVerification:true,credential:{...saved,publicKey:new Uint8Array(saved.publicKey)}});if(!verification.verified)return fail('verification_failed',401);await kv.put('admin-passkey',JSON.stringify({...saved,counter:verification.authenticationInfo.newCounter}));
  }
  const r=NextResponse.json({ok:true});r.cookies.set('lbasy-admin',await createSession(env.SESSION_SECRET),{httpOnly:true,secure:url.protocol==='https:',sameSite:'strict',path:'/',maxAge:8*60*60});r.cookies.set('lbasy-webauthn','',{path:'/',maxAge:0});r.headers.set('Cache-Control','no-store');return r;
 }
 return fail('invalid_action');
 }catch{return fail('verification_failed',400);}
}
