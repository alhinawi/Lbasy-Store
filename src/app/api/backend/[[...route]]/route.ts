import { app } from "@/backend/app";
import { backendEnv } from "@/backend/context";
import { themeEnv, validSession } from "@/lib/themeServer";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";
async function handler(req: Request) {
  const [env, theme, jar] = await Promise.all([
    backendEnv(),
    themeEnv(),
    cookies(),
  ]);
  const LEGACY_ADMIN = await validSession(
    jar.get("lbasy-admin")?.value,
    theme.SESSION_SECRET,
  );
  return app.fetch(req, { ...env, LEGACY_ADMIN });
}
export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
