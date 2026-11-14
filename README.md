# Lbasy (لباسي)

Online store for imported second-hand clothes from Port Said. Every piece is one of a kind.
Arabic (RTL) by default, English under `/en`. Cash on delivery, shipping fee per governorate,
and an admin page at `/admin`.

Stack: Next.js 16 (App Router, TypeScript, Tailwind CSS 4), Supabase (database, auth, photo storage),
deployed to Cloudflare Pages (OpenNext Cloudflare adapter, packaged for Pages).

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
| `NEXT_PUBLIC_DEMO_ADMIN_PASSWORD` | no | `change-me` | Admin password in sample-data mode only (default `lbasy2026`). With Supabase, admins sign in with their Supabase account instead. |
| `NEXT_PUBLIC_INSTAGRAM_URL` | no | `https://instagram.com/lbasy` | Shown in the footer. |
| `NEXT_PUBLIC_FACEBOOK_URL` | no | `https://facebook.com/lbasy` | Shown in the footer. |
| `NEXT_PUBLIC_ONLINE_PAYMENT` | no | `1` | Turns on the "online payment" option once a payment provider is wired in. Leave empty for now. |

The Supabase service role key is **not** used. Never put it in a `NEXT_PUBLIC_*` variable.

## Deploy on Cloudflare Pages

The site runs on Cloudflare Pages at `https://lbasy.pages.dev` (project name `lbasy`).

How it works: `@cloudflare/next-on-pages` only supports Next.js up to 15.5 and is deprecated, so the
build still uses the OpenNext Cloudflare adapter and then packages its output for Pages
"advanced mode" (`scripts/build-pages.mjs`):

- `dist/` holds the static files from `.open-next/assets`.
- `dist/_worker.js/` is the OpenNext server bundled by Wrangler. Pages gives it the same `ASSETS`
  binding, so every page, the `/api/orders` route, the admin, share images and Supabase work as on Workers.
- `dist/_routes.json` lets Pages serve `/_next/static/*` and the public files without the worker.

The Pages config is `cloudflare/wrangler.jsonc` (it sits in its own folder because the root
`wrangler.jsonc` is the config OpenNext reads while building, and a root `pages/` folder would be read
by Next.js as a router).

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
- Root directory: `/`
- Environment variables: `NODE_VERSION` = `22` (also in `.node-version`) and the variables from the table above.

Then in the project → **Settings** → **Runtime**: compatibility date `2026-11-01` and compatibility
flags `nodejs_compat` and `global_fetch_strictly_public` (Git builds do not read `cloudflare/wrangler.jsonc`).

No KV, R2 or D1 has to be created: prerendered pages are read from the static files. With Supabase
connected the catalog pages render on each request, so new and sold pieces show up right away.
The root `wrangler.jsonc` still describes the same app as a Worker, and `npm run deploy` deploys it
that way, but the live site is the Pages project.

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
- `open-next.config.ts`, `wrangler.jsonc` OpenNext build config; `cloudflare/wrangler.jsonc`, `scripts/build-pages.mjs` Cloudflare Pages packaging

## The White Issue redesign

B13 is the default storefront. The dashboard contains 13 campaign/layout themes, with full-screen previews and a separate Publish action. Publishing uses Cloudflare KV binding `THEMES` so it affects visitors, not only the current browser. KV propagation can take about a minute. OG images are 1200x630 and follow the active theme.

The current catalog contains 80 sample variants built from 32 original AI-generated product images. All editorial campaign imagery is also AI-generated. Prices (EGP 129-599), sizes, measurements and condition are illustrative, not actual offers or stock. Replace these with real inventory before taking orders. The public notice and product notes make this explicit.

### Passwordless theme administration

Live admin authentication uses WebAuthn passkeys with required user verification. The first passkey requires an eight-digit, short-lived one-time enrollment code. That code is delivered privately to the owner, never stored in this repository. The device's fingerprint/face data never reaches the website. Subsequent sign-in uses the registered passkey. Sessions are signed with a server-only `SESSION_SECRET` and stored in Secure, HTTP-only, same-site cookies.

Required runtime bindings:
- `THEMES`: Cloudflare KV namespace for active theme, public passkey record, short-lived challenges, and enrollment attempt limits.
- `SESSION_SECRET`: server-only random signing key, set as a Cloudflare secret. Never give it a `NEXT_PUBLIC_` prefix.

Theme changes require an authenticated session and same-origin requests. Unauthenticated requests cannot publish. Enrollment codes expire after a short window and are consumed when registration starts. If registration is cancelled or the code expires, ask for a fresh code through the owner's trusted channel. Lost-device recovery requires verifying the owner, resetting the registered public passkey and issuing a fresh enrollment code; it is not an open public reset endpoint.

Products, drops, shipping and orders retain the existing demo/Supabase behavior. Without Supabase, those admin edits remain device-local. Shared theme persistence does not make the sample inventory or demo orders live. Connecting Supabase still requires configuring the database and its admin access separately.

The storefront supports touch swipe rails, scroll-snap category browsing, carousel buttons and scroll reveals. Motion is disabled when reduced-motion is requested.
