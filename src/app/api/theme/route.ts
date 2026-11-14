import { NextRequest, NextResponse } from 'next/server';
import { isTheme } from '@/lib/themes';
import { getThemeState, sameOrigin, themeEnv, validSession } from '@/lib/themeServer';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json(await getThemeState(),{headers:{'Cache-Control':'no-store'}});}
export async function PUT(req:NextRequest){
 if(!sameOrigin(req))return NextResponse.json({error:'origin'},{status:403});
 const e=await themeEnv();if(!e.THEMES)return NextResponse.json({error:'not_configured'},{status:503});
 if(!await validSession(req.cookies.get('lbasy-admin')?.value,e.SESSION_SECRET))return NextResponse.json({error:'unauthorized'},{status:401});
 let body;try{body=await req.json();}catch{return NextResponse.json({error:'invalid'},{status:400});}
 const current=await getThemeState();
 if(body.rotation){
  const {enabled,intervalMinutes}=body.rotation;
  if(typeof enabled!=='boolean'||!Number.isInteger(intervalMinutes)||intervalMinutes<1||intervalMinutes>10080)return NextResponse.json({error:'invalid_interval'},{status:400});
  await e.THEMES.put('active-theme',current.theme);
  await e.THEMES.put('theme-rotation',JSON.stringify({enabled,intervalMinutes,startedAt:Date.now(),startTheme:current.theme}));
 }else{
  if(!isTheme(body.theme))return NextResponse.json({error:'invalid_theme'},{status:400});
  await e.THEMES.put('active-theme',body.theme);
  await e.THEMES.put('theme-rotation',JSON.stringify({...current.rotation,enabled:false}));
 }
 return NextResponse.json({ok:true,...await getThemeState()},{headers:{'Cache-Control':'no-store'}});
}
