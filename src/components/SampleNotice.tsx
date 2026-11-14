'use client';
import { usePathname } from 'next/navigation';
export function SampleNotice({lang}:{lang:string}){const path=usePathname();if(path==='/'||path==='/en'||path==='/ar')return null;return <div className="sample-notice" role="note">{lang==='ar'?'معاينة المتجر: الصور مولدة بالـAI، والأسعار والمقاسات تجريبية، مش مخزون فعلي للبيع.':'Store preview: AI images, prices and measurements are samples, not real inventory for sale.'}</div>}
