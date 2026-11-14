import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfigured } from "./config";

let browserClient: SupabaseClient | null = null;

/** Read-only client for server components. Always reads fresh data. */
export function serverSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

/** Client used in the browser (checkout and admin). */
export function browserSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!browserClient) {
    browserClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return browserClient;
}
