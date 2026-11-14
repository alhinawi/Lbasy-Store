export const themes = [
  { id: 'B13', name: 'The White Issue', ar: 'العدد الأبيض', color: '#ffffff', ink: '#24241f', layout: 'journal', title: 'Wear something with a past.', sub: 'وبداية على ذوقك.', image: 'coatman', second: 'sweat' },
  { id: 'B02', name: 'Port Studio', ar: 'بورت ستوديو', color: '#203e32', ink: '#f0eee1', layout: 'studio', title: 'Dressed by instinct.', sub: 'قطع ليها حكاية. اختار الحكاية اللي تشبهك.', image: 'coatman', second: 'jeans' },
  { id: 'B11', name: 'Runway Split', ar: 'رانواي', color: '#161613', ink: '#ffffff', layout: 'runway', title: 'A wardrobe without repeats.', sub: 'كل قطعة واحدة. وكل مرة مختلفة.', image: 'coatman', second: 'jacket' },
  { id: 'B03', name: 'New Wave', ar: 'نيو ويف', color: '#e9ecff', ink: '#162fca', layout: 'wave', title: 'NEW WAVE.', sub: 'الجديد مش دايمًا أول مرة.', image: 'denimman', second: 'man' },
  { id: 'B04', name: 'The Silent Label', ar: 'الليبل الهادي', color: '#f5f2e9', ink: '#24241f', layout: 'quiet', title: 'Less noise. More you.', sub: 'تفاصيل قليلة. حضور مختلف.', image: 'leatherman', second: 'sweat' },
  { id: 'B06', name: 'The Weekender', ar: 'الويك إندر', color: '#d8ed8f', ink: '#233c29', layout: 'weekend', title: 'OUT OF OFFICE.', sub: 'لبس على مزاجك. مش على المقاس المعتاد.', image: 'carman', second: 'sneaker' },
  { id: 'B08', name: 'Maison Port', ar: 'ميزون بورت', color: '#501b30', ink: '#f7efdf', layout: 'windows', title: 'The art of finding.', sub: 'اختيارات قليلة. احتمالات كتير.', image: 'coatman', second: 'denimman' },
  { id: 'B10', name: 'The Sand Edit', ar: 'ساند إديت', color: '#e0d3b7', ink: '#332d22', layout: 'arches', title: 'Soft statements.', sub: 'خامات بتحبها. وقطع ترجع لها.', image: 'leatherman', second: 'rack' },
  { id: 'B12', name: 'Red Thread', ar: 'ريد ثريد', color: '#ba2017', ink: '#fff7e8', layout: 'studio', title: 'A life well worn.', sub: 'روح جديدة لقطع تستاهل تكمل.', image: 'jacket', second: 'tee' },
  { id: 'B14', name: 'Sport Social', ar: 'سبورت سوشيال', color: '#f3f1e6', ink: '#23241e', layout: 'sport', title: 'GOOD ENERGY.', sub: 'لحركتك. ولليوم اللي على مزاجك.', image: 'carman', second: 'sneaker' },
  { id: 'B17', name: 'Bold in Arabic', ar: 'عربي جريء', color: '#f0ead9', ink: '#24231e', layout: 'arabic', title: 'لُقطة على ذوقك.', sub: 'قطع من بورسعيد. ستايل مالوش نسخة.', image: 'jacket', second: 'tee' },
  { id: 'B19', name: 'Coastline', ar: 'كوستلاين', color: '#cadce1', ink: '#1f3036', layout: 'windows', title: 'Port of style.', sub: 'ستايل جاي من عند البحر.', image: 'denimman', second: 'leatherman' },
  { id: 'B20', name: 'The Film Edit', ar: 'فيلم إديت', color: '#33221d', ink: '#f5ecdf', layout: 'film', title: 'Every piece, a frame.', sub: 'حكايتك لسه بتبدأ.', image: 'coatman', second: 'jacket' },
] as const;
export type ThemeId = typeof themes[number]['id'];
export type StoreTheme = typeof themes[number];
export const DEFAULT_THEME: ThemeId = 'B13';
export const findTheme = (id: string | null | undefined): StoreTheme => themes.find(t => t.id === id) ?? themes[0];
export const isTheme = (id: unknown): id is ThemeId => themes.some(t => t.id === id);
