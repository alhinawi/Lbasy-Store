'use client';
import { usePathname } from 'next/navigation';
export function SampleNotice({lang}:{lang:string}){const path=usePathname();if(path==='/'||path==='/en'||path==='/ar')return null;return <div className="sample-notice" role="note">{lang==='ar'?'معاينة المتجر: المنتجات والأسعار والمقاسات أمثلة للتجربة، مش مخزون فعلي للبيع.':'Store preview: products, prices and measurements are samples, not real inventory for sale.'}</div>}
