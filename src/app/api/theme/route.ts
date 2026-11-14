import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_THEME, isTheme } from '@/lib/themes';
import { sameOrigin, themeEnv, validSession } from '@/lib/themeServer';
export const dynamic='force-dynamic';
export async function GET(){const e=await themeEnv();const theme=await e.THEMES?.get('active-theme');return NextResponse.json({theme:isTheme(theme)?theme:DEFAULT_THEME,shared:!!e.THEMES,publishReady:!!(e.THEMES&&e.SESSION_SECRET)},{headers:{'Cache-Control':'no-store'}});}
export async function PUT(req:NextRequest){
 if(!sameOrigin(req))return NextResponse.json({error:'origin'},{status:403});
 const e=await themeEnv();if(!e.THEMES)return NextResponse.json({error:'not_configured'},{status:503});
 if(!await validSession(req.cookies.get('lbasy-admin')?.value,e.SESSION_SECRET))return NextResponse.json({error:'unauthorized'},{status:401});
 let theme:unknown;try{theme=(await req.json()).theme;}catch{return NextResponse.json({error:'invalid'},{status:400});}
 if(!isTheme(theme))return NextResponse.json({error:'invalid_theme'},{status:400});
 await e.THEMES.put('active-theme',theme);return NextResponse.json({ok:true,theme},{headers:{'Cache-Control':'no-store'}});
}
