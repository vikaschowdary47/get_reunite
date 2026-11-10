import { createHash } from "node:crypto";
import { db } from "./db";

/**
 * Sliding-window rate limit stored in the database so it works across
 * serverless instances. Returns true when the action is allowed.
 */
export async function allow(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const c = await db();
  const now = Date.now();
  const since = now - windowSeconds * 1000;
  await c.execute({ sql: "DELETE FROM rate_hits WHERE at < ?", args: [now - 86_400_000] });
  const res = await c.execute({
    sql: "SELECT COUNT(*) AS n FROM rate_hits WHERE key = ? AND at >= ?",
    args: [key, since],
  });
  if (Number(res.rows[0].n) >= limit) return false;
  await c.execute({ sql: "INSERT INTO rate_hits (key, at) VALUES (?, ?)", args: [key, now] });
  return true;
}

/** Hash the client IP so raw addresses are never stored. */
export function ipKey(forwardedFor: string | null): string {
  const ip = (forwardedFor ?? "unknown").split(",")[0].trim();
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}
