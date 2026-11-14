'use client';
import Link from 'next/link';
import { useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { Fingerprint, Loader2 } from 'lucide-react';
import { Wordmark } from '../Logo';
export function PasskeyLogin({registered,onDone}:{registered:boolean;onDone:(u:string)=>void}){
 const [code,setCode]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function login(){setBusy(true);setError('');try{
  if(!window.PublicKeyCredential)throw Error('المتصفح ده مش بيدعم مفاتيح المرور. افتح الموقع في Chrome أو Safari على جهازك.');
  const action=registered?'login':'register';const r=await fetch('/api/admin/passkey',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:action+'-options',code})});const options=await r.json();if(!r.ok)throw Error(r.status===429?'محاولات كتير. استنى شوية.':registered?'تعذر بدء الدخول. جرّب تاني.':'كود التفعيل غير صحيح أو انتهى. اطلب كود جديد.');
  const response=registered?await startAuthentication({optionsJSON:options}):await startRegistration({optionsJSON:options});const v=await fetch('/api/admin/passkey',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:action+'-verify',response})});if(!v.ok)throw Error('تعذر التحقق. جرّب تاني، أو اطلب كود تفعيل جديد لو دي أول مرة.');onDone('store-admin');
 }catch(e){setError(e instanceof Error&&e.name==='NotAllowedError'?'التحقق اتقفل أو الوقت انتهى. جرّب تاني.':e instanceof Error?e.message:'تعذر الدخول.');}finally{setBusy(false);}}
 return <div className="grid min-h-dvh place-items-center bg-[#f7f6ef] p-5"><div className="w-full max-w-md border border-line bg-white p-8"><Wordmark lang="ar"/><div className="mt-12"><Fingerprint className="mb-5 h-9 w-9" strokeWidth={1}/><h1 className="text-2xl">{registered?'دخول من غير باسورد.':'فعّل دخولك من جهازك.'}</h1><p className="mt-4 text-sm leading-8 text-muted">{registered?'استخدم بصمة جهازك، Face ID أو طريقة فتح الجهاز. بيانات البصمة بتفضل على جهازك، ومش بتتبعت للمتجر.':'أول مرة بس: ادخل كود التفعيل المؤقت اللي وصلك، وسجّل مفتاح مرور على جهازك. بعد كده هتدخل ببصمة أو فتح الجهاز، من غير باسورد تحفظه.'}</p>{!registered&&<label className="mt-6 block text-sm">كود التفعيل المؤقت<input className="field mt-2" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label>}<button onClick={login} disabled={busy||(!registered&&code.length!==8)} className="btn-primary mt-7 w-full">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Fingerprint className="h-5 w-5"/>}{registered?'ادخل ببصمة جهازك':'تفعيل مفتاح المرور'}</button>{error&&<p className="mt-4 text-sm leading-7 text-red-800" role="alert">{error}</p>}<Link href="/" className="mt-6 block text-center text-xs text-muted">ارجع للمتجر ←</Link></div></div></div>;
}
