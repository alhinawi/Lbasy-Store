import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { BackendEnv } from "./env";
export async function backendEnv(): Promise<BackendEnv> {
  try {
    return (await getCloudflareContext({ async: true }))
      .env as unknown as BackendEnv;
  } catch {
    return {};
  }
}
