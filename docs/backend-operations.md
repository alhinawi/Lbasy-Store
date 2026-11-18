# LBASY accounts and Hono backend

## Architecture

The Next.js frontend calls the Hono app at `/api/backend`. The catch-all Next route adapts the existing Cloudflare Pages runtime bindings. There is no separate Worker, cross-origin API, paid plan or external auth database. Existing KV theme settings and passkey administration remain intact.

Data is stored in D1: users, hashed session tokens, rate-limit buckets, saved cart/favorite IDs, products, drops, shipping zones, orders and order lines. Prices and stock are read by the server. D1 batches and an inventory trigger reserve all one-off items atomically. A UUID idempotency key prevents duplicate orders when a response is retried. Only cash-on-delivery orders are accepted.

Passwords use salted PBKDF2-SHA256, 100,000 iterations, the Workers Web Crypto per-call limit. Sessions use random 256-bit tokens, only hashes in D1, HttpOnly/SameSite cookies, Secure over HTTPS, 30-day expiry and server-side logout. Mutation endpoints reject missing or cross-origin Origin headers. Login/signup and ordering have database-backed limits. No browser-supplied role or price is trusted. Password signup never grants admin based on the email entered.

Anonymous browsing/cart/favorites continue to work locally. Anonymous saved choices merge once after login. Signing out clears that account's device state, and private order details are not persisted in local storage. The API always checks ownership.

## Local verification

```sh
npm ci
npm run db:migrate:local
npm run db:seed:local
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
```

`next dev` uses OpenNext's local Cloudflare bindings. These commands do not query remote D1. The isolated D1 tests use Miniflare 4's supported 2026-08-01 compatibility date; the application retains its existing 2026-11-01 Cloudflare compatibility date. Browser checks can run with `node tests/account-visual.mjs` after `npx playwright install chromium`.

## Deployment after D1 quota resets

Do not deploy the database placeholder UUID as a real binding. Do not retry exhausted D1 quota or upgrade the account.

1. Confirm the final merged commit includes the separate catalog PR. Run `npm ci`, `npm run db:seed:generate`. The generator reads that commit's current catalog and writes `.local/catalog-import.sql`, never stale copied catalog data.
2. Find the existing dedicated LBASY D1 database, or create a new dedicated `lbasy-store` database on the free plan. Never reuse another site's DB. Replace the placeholder `database_id` in both `wrangler.jsonc` and `cloudflare/wrangler.jsonc` with that actual UUID. Bind it to the Pages production environment as `DB`.
3. If reusing a database, export a backup first and verify the export. Inspect existing schema for name collisions before applying this migration. Do not overwrite existing tables from another system. The migration is additive but cannot safely merge unknown schemas.
4. Apply only the schema migration using `wrangler d1 migrations apply DB --remote` from the repo root. Then execute `.local/catalog-import.sql` against that exact DB. Inserts are `INSERT OR IGNORE`: no existing product, shipping, stock, order or customer data is overwritten or deleted. Rerunning the import is safe. Existing products with the same ID are intentionally not refreshed; any catalog updates to already-imported products need a reviewed targeted update.
5. Existing Pages `THEMES` KV and `SESSION_SECRET` remain required for theme publishing and passkey admin. Email/password accounts do not need a new session secret.
6. Optional Google sign-in: set `GOOGLE_CLIENT_ID` and secret `GOOGLE_CLIENT_SECRET` in Pages production, and register `https://lbasy.pages.dev/api/backend/auth/google/callback` as an authorized redirect URI. Set `ADMIN_EMAIL` to the owner's verified Google email only if that Google identity should become an admin. OAuth requests use state, a short-lived HttpOnly cookie and PKCE, and check Google's verified email. No automatic linking to a password-only account is allowed. Do not claim Google login is verified until an actual production callback succeeds.
7. Build via `npm run pages:build`; deploy the existing `lbasy` Pages project from `main` only. Do not create preview deployments. Verify the live binding and run a non-ordering account check. A real cash-on-delivery order is a business record, so do not place test orders in production without authorization.

## Admin and preservation

The existing owner passkey session authorizes Hono admin APIs. Google-created admins can also use the account page to enter the dashboard. Password-created users stay customers unless the operator explicitly grants a role following owner approval. Never put a password or admin bootstrap credential in source code.

Product and drop edits, publication flags, shipping and status transitions are persisted. The application has no hard-delete endpoint. Drop removal archives the drop. Product deletion remains blocked; use its publication checkbox. Cancelling an order does not automatically re-list its used items. An admin must inspect and explicitly restore stock. Cancelled/delivered orders cannot be reopened by a normal status change.

Existing multi-image product uploads are resized in the browser and saved as bounded image data URLs in the product's D1 record, without requiring paid object storage. Each resized upload is capped at 180 KB, the record at 1.8 MB and images at 12. If the limit is hit, reduce photo count or size. A future R2 binding can move the binary content out of D1 without changing the product image-array contract.

Email verification and email password recovery are not configured. No email sending provider has been authorized or connected for LBASY. Do not show success messages for either workflow. Existing passwords can still sign in; Google sign-in appears only when OAuth is configured. Plan recovery and verification before a wide customer launch.

## Rollback

Keep the previous deployed bundle and the D1 export. Redeploy the previous application bundle if required; keep the additive tables intact. Do not drop tables or delete real accounts/orders as a rollback. Restore a backup only with the owner's explicit data decision and after reconciling any orders created since the backup.

## Required inventory activation

Catalog imports are visible for browsing but start with `inventory_confirmed=0`. They cannot create a COD order. Licensed photos, generated design examples and supplier inspiration are not physical stock. In Admin > Products, an owner must explicitly confirm each actual piece's photos, size, condition and price using the inventory confirmation button. Editing a product resets that confirmation. Both the API and a D1 trigger enforce this rule; client code cannot bypass it. Migration `0002_confirmed_inventory.sql` adds this safeguard without deleting or hiding existing catalog data.
