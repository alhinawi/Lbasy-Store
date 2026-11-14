# Lbasy (لباسي)

Online store for imported second-hand clothes from Port Said. Every piece is one of a kind.
Arabic (RTL) by default, English under `/en`. Cash on delivery, shipping fee per governorate,
and an admin page at `/admin`.

Stack: Next.js 16 (App Router, TypeScript, Tailwind CSS 4), Supabase (database, auth, photo storage),
deployed to Cloudflare Workers with the OpenNext Cloudflare adapter.

Without Supabase settings the site runs on built-in sample data (26 pieces, 3 drops). Orders in
that mode are kept in the visitor's browser only, and the admin uses a demo password.

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
npm run preview              # builds for Cloudflare and runs it locally on http://localhost:8787
```

## Environment variables

All variables are read at build time (`NEXT_PUBLIC_*` values are baked into the build), so on
Cloudflare add them as **build variables**, then redeploy after changing one.

| Variable | Required | Example | What it does |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://lbasy.example.workers.dev` | Public address, used for links, sitemap and share images. No trailing slash. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | yes | `201012345678` | Store WhatsApp in international format, no `+`. Used by "Order on WhatsApp". |
| `NEXT_PUBLIC_SUPABASE_URL` | no | `https://abcd.supabase.co` | Supabase project URL. Leave empty to run on sample data. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | `eyJ...` | Supabase anon (public) key. Needed together with the URL. |
| `NEXT_PUBLIC_DEMO_ADMIN_PASSWORD` | no | `change-me` | Admin password in sample-data mode only (default `lbasy2026`). With Supabase, admins sign in with their Supabase account instead. |
| `NEXT_PUBLIC_INSTAGRAM_URL` | no | `https://instagram.com/lbasy` | Shown in the footer. |
| `NEXT_PUBLIC_FACEBOOK_URL` | no | `https://facebook.com/lbasy` | Shown in the footer. |
| `NEXT_PUBLIC_ONLINE_PAYMENT` | no | `1` | Turns on the "online payment" option once a payment provider is wired in. Leave empty for now. |

The Supabase service role key is **not** used. Never put it in a `NEXT_PUBLIC_*` variable.

## Deploy on Cloudflare

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository** → pick GitHub repo `Lbasy-Store`.
2. Settings:
   - Project name: `lbasy` (must match `name` in `wrangler.jsonc`)
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
   - Root directory: `/`
3. Advanced settings → Build variables: add `NODE_VERSION` = `22` (also set in `.node-version`) and
   the variables from the table above.
4. Save and deploy. Every push to `main` deploys again.

The Worker config is in `wrangler.jsonc` (Node.js compatibility on). Prerendered pages are served
from static assets, so no KV, R2 or D1 has to be created. With Supabase connected the catalog pages
render on each request, so new and sold pieces show up right away.

From your own machine you can also run `npx wrangler login` once, then `npm run deploy`.

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

Shipping fees: **الشحن** (Shipping) tab. Drops: **الشحنات** (Drops) tab.

## Project layout

- `src/app/[lang]/` store pages (`ar` is served without a prefix, `en` under `/en`)
- `src/app/admin/` admin page, `src/components/admin/` its panels
- `src/app/api/orders/` checkout endpoint
- `src/lib/data.ts` catalog reads (Supabase or sample data), `src/lib/seed.ts` sample data
- `supabase/` database migration and seed
- `open-next.config.ts`, `wrangler.jsonc` Cloudflare setup
