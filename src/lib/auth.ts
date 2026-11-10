import { db } from "./db";
import { hash, newId, newOtpCode, newToken } from "./ids";

/**
 * Passwordless accounts. A six-digit code is emailed, and entering it signs
 * the person in. Codes are stored hashed, expire quickly and allow only a few
 * attempts. Sessions are random tokens stored hashed.
 */

export type User = { id: string; email: string; createdAt: number };

export type OtpPayload = { code: string; label: string; note: string; lang: string };

const OTP_TTL_MS = 10 * 60_000;
const OTP_MAX_ATTEMPTS = 5;
const SESSION_TTL_MS = 30 * 86_400_000;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function createOtp(email: string, payload: OtpPayload | null) {
  const c = await db();
  const id = newId();
  const code = newOtpCode();
  const now = Date.now();
  await c.execute({ sql: "DELETE FROM otps WHERE expires_at < ?", args: [now - 86_400_000] });
  await c.execute({
    sql: "INSERT INTO otps (id, email, code_hash, payload, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, normalizeEmail(email), hash(`otp:${id}:${code}`), payload ? JSON.stringify(payload) : null, now + OTP_TTL_MS, now],
  });
  return { id, code };
}

export async function getOtp(id: string): Promise<{ email: string; payload: OtpPayload | null; expired: boolean } | null> {
  const c = await db();
  const r = await c.execute({ sql: "SELECT email, payload, expires_at, used FROM otps WHERE id = ?", args: [id] });
  const row = r.rows[0];
  if (!row || row.used) return null;
  return {
    email: String(row.email),
    payload: row.payload ? (JSON.parse(String(row.payload)) as OtpPayload) : null,
    expired: Number(row.expires_at) < Date.now(),
  };
}

export type OtpCheck =
  | { ok: true; email: string; payload: OtpPayload | null }
  | { ok: false; reason: "missing" | "expired" | "locked" | "wrong"; left?: number };

export async function checkOtp(id: string, code: string): Promise<OtpCheck> {
  const c = await db();
  const r = await c.execute({ sql: "SELECT * FROM otps WHERE id = ?", args: [id] });
  const row = r.rows[0];
  if (!row || row.used) return { ok: false, reason: "missing" };
  if (Number(row.expires_at) < Date.now()) return { ok: false, reason: "expired" };
  const attempts = Number(row.attempts);
  if (attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "locked" };

  if (row.code_hash === hash(`otp:${id}:${code}`)) {
    const res = await c.execute({ sql: "UPDATE otps SET used = 1 WHERE id = ? AND used = 0", args: [id] });
    if (res.rowsAffected !== 1) return { ok: false, reason: "missing" };
    return {
      ok: true,
      email: String(row.email),
      payload: row.payload ? (JSON.parse(String(row.payload)) as OtpPayload) : null,
    };
  }
  await c.execute({ sql: "UPDATE otps SET attempts = attempts + 1 WHERE id = ?", args: [id] });
  return { ok: false, reason: "wrong", left: OTP_MAX_ATTEMPTS - attempts - 1 };
}

export async function upsertUser(email: string): Promise<User> {
  const c = await db();
  const e = normalizeEmail(email);
  const now = Date.now();
  await c.execute({
    sql: "INSERT INTO users (id, email, created_at, last_login_at) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET last_login_at = excluded.last_login_at",
    args: [newId(), e, now, now],
  });
  const r = await c.execute({ sql: "SELECT id, email, created_at FROM users WHERE email = ?", args: [e] });
  const u = r.rows[0];
  return { id: String(u.id), email: String(u.email), createdAt: Number(u.created_at) };
}

export async function createSession(userId: string): Promise<string> {
  const c = await db();
  const token = newToken();
  const now = Date.now();
  await c.execute({ sql: "DELETE FROM sessions WHERE expires_at < ?", args: [now] });
  await c.execute({
    sql: "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    args: [hash(`sess:${token}`), userId, now + SESSION_TTL_MS, now],
  });
  return token;
}

export async function userFromSession(token: string): Promise<User | null> {
  const c = await db();
  const r = await c.execute({
    sql: `SELECT u.id, u.email, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.expires_at > ?`,
    args: [hash(`sess:${token}`), Date.now()],
  });
  const u = r.rows[0];
  return u ? { id: String(u.id), email: String(u.email), createdAt: Number(u.created_at) } : null;
}

export async function deleteSession(token: string) {
  const c = await db();
  await c.execute({ sql: "DELETE FROM sessions WHERE token_hash = ?", args: [hash(`sess:${token}`)] });
}

export async function deleteUser(userId: string) {
  const c = await db();
  await c.execute({ sql: "DELETE FROM sessions WHERE user_id = ?", args: [userId] });
  await c.execute({ sql: "DELETE FROM users WHERE id = ?", args: [userId] });
}
