import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";

/**
 * Database access. Local development uses a SQLite file; production points
 * TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) at a hosted libSQL database.
 * The schema is created on first use, so there is no separate migration step.
 */

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS tags (
    code TEXT PRIMARY KEY,
    pin_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unclaimed',
    kind TEXT NOT NULL DEFAULT 'car',
    label TEXT,
    owner_email TEXT,
    note TEXT,
    lang TEXT NOT NULL DEFAULT 'en',
    manage_epoch INTEGER NOT NULL DEFAULT 0,
    batch TEXT,
    created_at INTEGER NOT NULL,
    claimed_at INTEGER,
    user_id TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    tag_code TEXT NOT NULL REFERENCES tags(code),
    body TEXT NOT NULL,
    translated_body TEXT,
    finder_lang TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    urgency TEXT NOT NULL DEFAULT 'normal',
    summary TEXT,
    quick_replies TEXT,
    blocked INTEGER NOT NULL DEFAULT 0,
    block_reason TEXT,
    finder_contact TEXT,
    finder_where TEXT,
    lat REAL,
    lng REAL,
    reply_token_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    ai_source TEXT NOT NULL DEFAULT 'rules',
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_messages_tag ON messages(tag_code, created_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_reply ON messages(reply_token_hash)`,
  `CREATE TABLE IF NOT EXISTS replies (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES messages(id),
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS rate_hits (
    key TEXT NOT NULL,
    at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_rate_key ON rate_hits(key, at)`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    last_login_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS otps (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    payload TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    used INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
  `CREATE TABLE IF NOT EXISTS outbox (
    id TEXT PRIMARY KEY,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
];

let client: Client | undefined;
let ready: Promise<void> | undefined;

function open(): Client {
  if (!client) {
    if ((process.env.NETLIFY || process.env.VERCEL) && !process.env.TURSO_DATABASE_URL) {
      throw new Error("TURSO_DATABASE_URL is not set. Serverless hosting has no writable disk; use a Turso database.");
    }
    const url = process.env.TURSO_DATABASE_URL ?? "file:./data/tagback.db";
    if (url.startsWith("file:")) {
      fs.mkdirSync(path.dirname(url.slice("file:".length)), { recursive: true });
    }
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  return client;
}

/** Bring databases created by an earlier version up to date. */
async function migrate(c: Client) {
  const cols = await c.execute("PRAGMA table_info(tags)");
  if (!cols.rows.some((r) => r.name === "user_id")) {
    await c.execute("ALTER TABLE tags ADD COLUMN user_id TEXT");
  }
  await c.execute("CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id)");
}

export async function db(): Promise<Client> {
  const c = open();
  ready ??= c
    .batch(SCHEMA, "write")
    .then(() => migrate(c))
    .then(() => undefined);
  await ready;
  return c;
}

/** Test helper: drop the cached connection so a new URL takes effect. */
export function resetDbForTests() {
  client?.close();
  client = undefined;
  ready = undefined;
}
