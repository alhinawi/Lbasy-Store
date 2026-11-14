import { NextRequest, NextResponse } from 'next/server';
import { sameOrigin, themeEnv, validSession } from '@/lib/themeServer';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){const e=await themeEnv();return NextResponse.json({configured:!!(e.SESSION_SECRET&&e.THEMES),authenticated:await validSession(req.cookies.get('lbasy-admin')?.value,e.SESSION_SECRET),passkeyRegistered:!!(await e.THEMES?.get('admin-passkey'))},{headers:{'Cache-Control':'no-store'}});}
export async function DELETE(req:NextRequest){if(!sameOrigin(req))return NextResponse.json({error:'origin'},{status:403});const r=NextResponse.json({ok:true});r.cookies.set('lbasy-admin','',{maxAge:0,path:'/'});return r;}
