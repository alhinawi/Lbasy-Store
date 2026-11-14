import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Prerendered pages are served from the Worker's static assets, so no R2 bucket,
// KV namespace or D1 database has to be created. With Supabase connected the
// catalog pages render on each request (see src/lib/data.ts), so nothing goes stale.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
