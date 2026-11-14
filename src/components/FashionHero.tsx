'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useStoreTheme } from './ThemeProvider';
import { href } from '@/lib/i18n';
import type { Lang } from '@/lib/types';
export function FashionHero({lang}:{lang:Lang}) {
 const {theme} = useStoreTheme(); const ar=lang==='ar';
 return <section className={`fashion-hero hero-${theme.layout}`} aria-label={ar?'مجموعة لباسي':'The LBASY edit'}>
  <div className="hero-edition" dir="ltr">THE WHITE ISSUE / PORT SAID EDITION</div>
  <div className="campaign-image campaign-main"><Image src={`/editorial/${theme.image}.webp`} alt={ar?'تصوير تحريري لأزياء رجالية':'Menswear editorial campaign'} fill priority sizes="(max-width: 700px) 100vw, 55vw" /></div>
  <div className="campaign-image campaign-second"><Image src={`/editorial/${theme.second}.webp`} alt={ar?'تفاصيل من مجموعة التصوير':'Editorial garment detail'} fill sizes="(max-width: 700px) 30vw, 25vw" /></div>
  {(theme.layout==='runway'||theme.layout==='film')&&<div className="campaign-image campaign-third"><Image src="/editorial/denimman.webp" alt={ar?'إطلالة دنيم رجالية':'Menswear denim editorial'} fill sizes="33vw" /></div>}
  {theme.layout==='film'&&<div className="campaign-image campaign-fourth"><Image src="/editorial/man.webp" alt={ar?'جاكيت من التصوير التحريري':'Jacket editorial'} fill sizes="25vw" /></div>}
  <div className="hero-copy"><span className="editorial-kicker" dir="ltr">{theme.id==='B13'?'THE REWEAR JOURNAL':'LBASY / THE PORT SAID EDIT'}</span><h1 dir={theme.layout==='arabic'?'rtl':'ltr'}>{theme.title}</h1><p>{ar?theme.sub:'One of a kind. Ready for your next chapter.'}</p><div className="hero-links"><Link href={href(lang,'/shop/women')}>{ar?'اكتشف الحريمي':'Explore women'}</Link><Link href={href(lang,'/shop/men')}>{ar?'اكتشف الرجالي':'Explore men'}</Link><Link href={href(lang,'/shop')}>{ar?'تسوق كل القطع':'Shop all pieces'}</Link></div></div>
  <div className="hero-foot"><span dir="ltr">{theme.id} / {theme.name.toUpperCase()}</span><span>{ar?'صور مولدة بالـAI للتوضيح، مش صور مخزون فعلي':'AI imagery, not actual inventory'}</span><a href="#new-in">{ar?'اكتشف الجديد ↓':'Discover the edit ↓'}</a></div>
 </section>;
}
