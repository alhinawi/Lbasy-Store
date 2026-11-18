-- Additive category expansion. No product data is inserted, deleted or updated.
begin;
alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check check (category in (
  'jackets', 'coats', 'jeans', 'pants', 'shirts', 'tshirts',
  'knitwear', 'hoodies', 'dresses', 'shoes', 'bags',
  'accessories', 'skirts', 'shorts', 'sets'
));
commit;
