<div align="center">

# Lbasy · لباسي

### Imported second-hand clothes from Port Said — every piece one of a kind

A full online store: drops, per-governorate shipping, cash on delivery, WhatsApp
ordering, and a complete admin panel. Arabic (RTL) by default, English under `/en`.

[![Live site](https://img.shields.io/badge/live-lbasy.pages.dev-0f766e?style=for-the-badge)](https://lbasy.pages.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)

[![Lbasy store](docs/screenshots/lbasy-hero.webp)](https://lbasy.pages.dev)

**[Browse the store →](https://lbasy.pages.dev)**

</div>

---

## What it is

- **A real storefront** — drops, product pages with up to 8 photos, sizes and
  measurements, condition and material, old/new prices.
- **Checkout that can't oversell** — one database transaction locks the pieces, so if
  two people order the same piece at the same moment, only one order goes through.
- **Cash on delivery** with a shipping fee per governorate (27 governorates seeded).
- **Order on WhatsApp** straight from the product page.
- **Admin panel** at `/admin` — products, drops, shipping fees, order statuses;
  cancelling an order puts its pieces back on sale automatically.
- **Works with zero setup** — without Supabase variables the site runs on built-in
  sample data (26 pieces, 3 drops) with a demo admin, so anyone can try it locally.

## Stack

Next.js 16 (App Router, TypeScript, Tailwind CSS 4) · Supabase (database, auth, photo
storage) · Cloudflare Pages (OpenNext Cloudflare adapter, packaged for Pages).

## Run locally

```bash
npm install
cp .env.example .env.local   # optional, the site works without it
npm run dev                  # http://localhost:3000
```

Checks:

```bash
npm run lint
npm run typecheck
npm run build
npm run pages:build          # builds for Cloudflare Pages into dist/
npm run pages:dev            # runs that build locally on http://localhost:8788
```

## Environment variables

All variables are read at build time (`NEXT_PUBLIC_*` values are baked into the build), so on
Cloudflare add them as **build variables**, then redeploy after changing one.

| Variable | Required | Example | What it does |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://lbasy.pages.dev` | Public address, used for links, sitemap and share images. No trailing slash. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | yes | `201012345678` | Store WhatsApp in international format, no `+`. Used by "Order on WhatsApp". |
| `NEXT_PUBLIC_SUPABASE_URL` | no | `https://abcd.supabase.co` | Supabase project URL. Leave empty to run on sample data. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | `eyJ...` | Supabase anon (public) key. Needed together with the URL. |
| `NEXT_PUBLIC_DEMO_ADMIN_PASSWORD` | no | `change-me` | Admin password in sample-data mode only. With Supabase, admins sign in with their Supabase account instead. |
| `NEXT_PUBLIC_INSTAGRAM_URL` | no | `https://instagram.com/lbasy` | Shown in the footer. |
| `NEXT_PUBLIC_FACEBOOK_URL` | no | `https://facebook.com/lbasy` | Shown in the footer. |
| `NEXT_PUBLIC_ONLINE_PAYMENT` | no | `1` | Turns on the "online payment" option once a payment provider is wired in. Leave empty for now. |

The Supabase service role key is **not** used. Never put it in a `NEXT_PUBLIC_*` variable.

## Deploy on Cloudflare Pages

The site runs on Cloudflare Pages at `https://lbasy.pages.dev` (project name `lbasy`).

How it works: `@cloudflare/next-on-pages` only supports Next.js up to 15.5 and is deprecated, so the
build uses the OpenNext Cloudflare adapter and then packages its output for Pages
"advanced mode" (`scripts/build-pages.mjs`):

- `dist/` holds the static files from `.open-next/assets`.
- `dist/_worker.js/` is the OpenNext server bundled by Wrangler. Pages gives it the same `ASSETS`
  binding, so every page, the `/api/orders` route, the admin, share images and Supabase work as on Workers.
- `dist/_routes.json` lets Pages serve `/_next/static/*` and the public files without the worker.

The Pages config is `cloudflare/wrangler.jsonc`.

### Deploy from a machine

```bash
npx wrangler login             # or set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
npm run pages:deploy           # build + upload to the lbasy project, production branch main
```

Put the variables from the table above in `.env.production.local` (git-ignored) before building.

### Or connect the GitHub repo (automatic deploys)

Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → `Lbasy-Store`:

- Project name: `lbasy`
- Production branch: `main`
- Framework preset: `None`
- Build command: `npm run pages:build`
- Build output directory: `dist`
- Environment variables: `NODE_VERSION` = `22` and the variables from the table above.

Then in the project → **Settings** → **Runtime**: compatibility date `2026-11-01` and compatibility
flags `nodejs_compat` and `global_fetch_strictly_public`.

No KV, R2 or D1 has to be created: prerendered pages are read from the static files. With Supabase
connected the catalog pages render on each request, so new and sold pieces show up right away.

## Connect Supabase

1. Create a project at supabase.com.
2. SQL editor: run `supabase/migrations/20261114000000_init.sql`, then `supabase/seed.sql`
   (sample shipping fees for the 27 governorates).
3. Authentication → Users → **Add user** with your email and a password.
4. SQL editor: make that user an admin:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

5. Project Settings → API: copy the project URL and the anon key into the Cloudflare build
   variables, then redeploy.

What the migration creates: `products`, `drops`, `shipping_zones`, `orders`, `order_items`,
`admins`, row level security (the public reads published items only; only admins write or read
orders), a public `products` storage bucket for photos (only admins upload), and these functions:

- `place_order(payload)`: used by the checkout. In one transaction it locks the pieces, checks
  they are all still available, creates the order and marks the pieces sold. If two people order
  the same piece at the same moment, only one order goes through; the other gets "already sold".
- `admin_set_order_status(order_id, new_status)`: cancelling an order puts its pieces back on sale.
- `is_admin()`: true when the signed-in user is in `admins`.

## Add a product

1. Open `/admin` and sign in.
2. **القطع** (Products) → **قطعة جديدة** (New piece).
3. Add up to 8 photos (the first is the cover). They are resized to WebP in the browser before upload.
4. Fill in name, brand, section (men / women / kids), category, size label, measurements in cm,
   condition, material, colour, price and an optional old price.
5. Pick the drop it came in, keep **Published** on, and save. It shows on the store right away.

When a piece is ordered it is marked sold automatically. To sell it again (for example after a
return), cancel the order or set its stock back to 1.

## Project layout

- `src/app/[lang]/` store pages (`ar` is served without a prefix, `en` under `/en`)
- `src/app/admin/` admin page, `src/components/admin/` its panels
- `src/app/api/orders/` checkout endpoint
- `src/lib/data.ts` catalog reads (Supabase or sample data), `src/lib/seed.ts` sample data

---

<div align="center">

Made with care by **Mohamed Alhinawi** · [lbasy.pages.dev](https://lbasy.pages.dev)

</div>
