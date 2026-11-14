-- Sample shipping fees in EGP for all 27 governorates (same as the demo data).
-- Edit them later from /admin -> Shipping. Safe to run more than once.

insert into public.shipping_zones (code, name_ar, name_en, fee, days, active) values
  ('PTS', 'بورسعيد', 'Port Said', 40, '1-2', true),
  ('C', 'القاهرة', 'Cairo', 60, '2-3', true),
  ('GZ', 'الجيزة', 'Giza', 60, '2-3', true),
  ('KB', 'القليوبية', 'Qalyubia', 65, '2-3', true),
  ('ALX', 'الإسكندرية', 'Alexandria', 65, '2-3', true),
  ('DK', 'الدقهلية', 'Dakahlia', 55, '1-2', true),
  ('DT', 'دمياط', 'Damietta', 50, '1-2', true),
  ('SHR', 'الشرقية', 'Sharqia', 55, '1-2', true),
  ('IS', 'الإسماعيلية', 'Ismailia', 50, '1-2', true),
  ('SUZ', 'السويس', 'Suez', 55, '2-3', true),
  ('GH', 'الغربية', 'Gharbia', 60, '2-3', true),
  ('MNF', 'المنوفية', 'Monufia', 60, '2-3', true),
  ('KFS', 'كفر الشيخ', 'Kafr El Sheikh', 60, '2-3', true),
  ('BH', 'البحيرة', 'Beheira', 65, '2-3', true),
  ('FYM', 'الفيوم', 'Faiyum', 75, '3-4', true),
  ('BNS', 'بني سويف', 'Beni Suef', 75, '3-4', true),
  ('MN', 'المنيا', 'Minya', 80, '3-4', true),
  ('AST', 'أسيوط', 'Asyut', 85, '3-5', true),
  ('SHG', 'سوهاج', 'Sohag', 85, '3-5', true),
  ('KN', 'قنا', 'Qena', 90, '3-5', true),
  ('LX', 'الأقصر', 'Luxor', 90, '3-5', true),
  ('ASN', 'أسوان', 'Aswan', 95, '4-6', true),
  ('BA', 'البحر الأحمر', 'Red Sea', 100, '4-6', true),
  ('MT', 'مطروح', 'Matrouh', 100, '4-6', true),
  ('WAD', 'الوادي الجديد', 'New Valley', 120, '5-7', true),
  ('SIN', 'شمال سيناء', 'North Sinai', 110, '4-6', true),
  ('JS', 'جنوب سيناء', 'South Sinai', 110, '4-6', true)
on conflict (code) do nothing;
