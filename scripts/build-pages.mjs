// Packages the OpenNext build for Cloudflare Pages (advanced mode).
// Run after `opennextjs-cloudflare build`; `npm run pages:build` does both.
//
// Output: `dist/`
//   - the static files from `.open-next/assets` (served by Pages directly)
//   - `_worker.js/`: the OpenNext server bundled into one module by Wrangler
//   - `_routes.json`: static paths skip the worker
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const assets = join(root, ".open-next", "assets");
const bundle = join(root, ".open-next", "pages-bundle");
const dist = join(root, "dist");

if (!existsSync(join(root, ".open-next", "worker.js"))) {
  console.error("Missing .open-next/worker.js: run `npx opennextjs-cloudflare build` first.");
  process.exit(1);
}

// 1. Bundle the worker with the Worker config (nodejs_compat, aliases), without deploying.
rmSync(bundle, { recursive: true, force: true });
execFileSync(
  "npx",
  ["wrangler", "deploy", "scripts/pages-entry.mjs", "--dry-run", "--outdir", bundle, "--config", "wrangler.jsonc"],
  { stdio: "inherit" },
);

// 2. Static files + worker bundle.
rmSync(dist, { recursive: true, force: true });
cpSync(assets, dist, { recursive: true });
mkdirSync(join(dist, "_worker.js"), { recursive: true });
for (const name of readdirSync(bundle)) {
  if (name.endsWith(".map") || name === "README.md") continue;
  cpSync(join(bundle, name), join(dist, "_worker.js", name === "pages-entry.js" ? "index.js" : name), {
    recursive: true,
  });
}
if (!existsSync(join(dist, "_worker.js", "index.js"))) {
  console.error("Worker bundle has no entry file:", readdirSync(bundle));
  process.exit(1);
}

// 3. Let Pages serve hashed assets and public files without waking the worker.
const exclude = ["/_next/static/*"];
for (const name of readdirSync(assets)) {
  if (name === "_next" || name === "cdn-cgi" || name === "BUILD_ID") continue;
  exclude.push(statSync(join(assets, name)).isDirectory() ? `/${name}/*` : `/${name}`);
}
writeFileSync(join(dist, "_routes.json"), JSON.stringify({ version: 1, include: ["/*"], exclude }, null, 2));

console.log(`Pages output ready in dist/ (${exclude.length} static rules).`);
