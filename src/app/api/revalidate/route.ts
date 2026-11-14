import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfigured } from "@/lib/config";

// Called by the admin after a change so the store shows it right away.
// Only a signed-in admin can trigger it.
export async function POST(req: Request) {
  if (!supabaseConfigured) return NextResponse.json({ ok: true, demo: true });
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await sb.rpc("is_admin");
  if (error || data !== true) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  revalidateTag("catalog", { expire: 0 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
