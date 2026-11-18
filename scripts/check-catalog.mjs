import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'src/lib/catalog.ts'), 'utf8');
const products = JSON.parse(source.slice(source.indexOf('= [') + 2).replace(/;\s*$/, ''));
const credits = readFileSync(resolve(root, 'docs/catalog-photos.md'), 'utf8');
const i18n = readFileSync(resolve(root, 'src/lib/i18n.ts'), 'utf8');
const ids = new Set();
const slugs = new Set();
const categories = {};
const genders = {};
for (const p of products) {
  assert(!ids.has(p.id), `Duplicate ID: ${p.id}`);
  assert(!slugs.has(p.slug), `Duplicate slug: ${p.slug}`);
  ids.add(p.id); slugs.add(p.slug);
  assert.match(p.slug, /^[a-z0-9-]+$/);
  assert(p.name_ar && p.name_en && p.size && p.condition);
  assert(Number.isInteger(p.price) && p.price > 0, `Non-integer price: ${p.id}`);
  assert(Number.isInteger(p.stock) && p.stock >= 0);
  assert(p.notes_en.includes('sample details'), `Missing sample context: ${p.id}`);
  assert(p.images.length >= 1);
  for (const image of p.images) {
    assert.match(image, /^\/catalog\/\d+\.webp$/);
    assert(existsSync(resolve(root, 'public' + image)), `Missing photo: ${image}`);
    assert(credits.includes('`' + image.split('/').pop() + '`'), `Missing credit: ${image}`);
  }
  assert(i18n.includes('"' + p.category + '"'), `Unregistered category: ${p.category}`);
  categories[p.category] = (categories[p.category] || 0) + 1;
  genders[p.gender] = (genders[p.gender] || 0) + 1;
}
assert.equal(products.length, 140);
assert.equal(Object.keys(categories).length, 15);
for (const [category, count] of Object.entries(categories)) assert(count >= 4, `Thin category: ${category}`);
assert(genders.kids >= 15 && genders.women >= 40 && genders.men >= 30);
assert(!products.some(p => /cable.knit|ضفاير/.test(p.name_en + p.name_ar)));
assert(!products.some(p => p.images.some(image => image.startsWith('/ai/'))));
const editor = readFileSync(resolve(root, 'src/components/admin/ProductEditor.tsx'), 'utf8');
assert(editor.includes('saveProduct({ ...p, published: false })'));
assert(!editor.includes('deleteProduct('));
console.log(JSON.stringify({ total: products.length, categories, genders, checks: 'passed' }, null, 2));
