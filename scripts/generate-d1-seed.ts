import { mkdirSync, writeFileSync } from "node:fs";
import { sampleProducts, sampleDrops, sampleShipping } from "../src/lib/seed";
const quote = (s: string) => "'" + s.replace(/'/g, "''") + "'";
const statements = [
  ...sampleProducts.map(
    (p) =>
      `INSERT OR IGNORE INTO products(id,slug,price,stock,published,data) VALUES(${quote(p.id)},${quote(p.slug)},${p.price},${p.stock},1,${quote(JSON.stringify(p))});`,
  ),
  ...sampleDrops.map(
    (d) =>
      `INSERT OR IGNORE INTO drops(slug,data) VALUES(${quote(d.slug)},${quote(JSON.stringify(d))});`,
  ),
  ...sampleShipping.map(
    (z) =>
      `INSERT OR IGNORE INTO shipping(code,data) VALUES(${quote(z.code)},${quote(JSON.stringify(z))});`,
  ),
];
mkdirSync(".local", { recursive: true });
writeFileSync(
  ".local/catalog-import.sql",
  "-- Additive catalog import. Existing records are never overwritten.\n" +
    statements.join("\n") +
    "\n",
);
console.log(`Generated ${statements.length} additive inserts.`);
