import { hashToken } from "./crypto";
import type { BackendEnv, User } from "./env";
export async function requestAccount(
  env: BackendEnv,
  token?: string,
): Promise<User | null> {
  if (!env.DB || !token) return null;
  return env.DB.prepare(
    "SELECT u.id,u.email,u.name,u.avatar,u.role FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?",
  )
    .bind(await hashToken(token), Date.now())
    .first<User>();
}
