'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useStoreTheme } from './ThemeProvider';
import { href } from '@/lib/i18n';
import type { Lang } from '@/lib/types';
export function FashionHero({lang}:{lang:Lang}) {
 const {theme} = useStoreTheme(); const ar=lang==='ar';
 return <section className={`fashion-hero hero-${theme.layout}`} aria-label={ar?'مجموعة لباسي':'The LBASY edit'}>
  <div className="hero-edition" dir={ar?"rtl":"ltr"}>{ar?"بالة بورسعيد أونلاين / قطع مستعملة متنقية واحدة واحدة":"PORT SAID SECONDHAND / HAND-PICKED, ONE OF A KIND"}</div>
  <div className="campaign-image campaign-main"><Image src={`/editorial/${theme.image}.webp`} alt={ar?'تصوير تحريري لأزياء رجالية':'Menswear editorial campaign'} fill priority sizes="(max-width: 700px) 100vw, 55vw" /></div>
  <div className="campaign-image campaign-second"><Image src={`/editorial/${theme.second}.webp`} alt={theme.second==='woman'?(ar?'امرأة بمعطف بيج ووشاح في تصوير أزياء':'Woman wearing a beige coat and headscarf'):(ar?'تفاصيل من مجموعة التصوير':'Editorial garment detail')} fill sizes="(max-width: 700px) 30vw, 25vw" /></div>
  {(theme.layout==='runway'||theme.layout==='film')&&<div className="campaign-image campaign-third"><Image src="/editorial/denimman.webp" alt={ar?'إطلالة جينز رجالية':'Menswear denim editorial'} fill sizes="33vw" /></div>}
  {theme.layout==='film'&&<div className="campaign-image campaign-fourth"><Image src="/editorial/woman.webp" alt={ar?'امرأة بمعطف بيج ووشاح في تصوير أزياء':'Woman wearing a beige coat and headscarf'} fill sizes="25vw" /></div>}
  <div className="hero-copy" dir={ar?"rtl":"ltr"}><span className="editorial-kicker" dir="ltr">{theme.id==='B13'?'THE REWEAR JOURNAL':'LBASY / THE PORT SAID EDIT'}</span><h1 className={ar?"hero-title-ar":""} dir={ar?"rtl":"ltr"}>{ar?"بالة بورسعيد. أونلاين.":"Port Said secondhand. Online."}</h1><p>{ar?"لباسي متجر ملابس مستعملة، متنقية قطعة قطعة. كل قطعة واحدة بس، ولما تروح مش بتتكرر.":"LBASY is a hand-picked secondhand clothing store from Port Said. One of each piece. Once it is gone, it is gone."}</p><div className="hero-links"><Link href={href(lang,'/shop/women')}>{ar?'اكتشف الحريمي':'Explore women'}</Link><Link href={href(lang,'/shop/men')}>{ar?'اكتشف الرجالي':'Explore men'}</Link><Link href={href(lang,'/shop')}>{ar?'تسوق كل القطع':'Shop all pieces'}</Link></div></div>
  <div className="hero-foot"><span dir="ltr">{theme.id} / {theme.name.toUpperCase()}</span><span>{ar?'اختيارات ليها حكاية':'Pieces with a story'}</span><a href="#new-in">{ar?'اكتشف الجديد ↓':'Discover the edit ↓'}</a></div>
 </section>;
}
