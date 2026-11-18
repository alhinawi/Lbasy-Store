import type { D1Database } from "@cloudflare/workers-types";
export interface BackendEnv {
  DB?: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  ADMIN_EMAIL?: string;
}
export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: "customer" | "admin";
}
