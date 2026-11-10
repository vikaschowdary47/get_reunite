import { db } from "./db";
import { hash, manageToken, manageTokenCode, manageTokenValid, newCode, newId, newPin, newToken } from "./ids";

export type { TagKind } from "./kinds";
import type { TagKind } from "./kinds";
export type Urgency = "urgent" | "normal" | "low";
export type Category =
  | "blocked_in"
  | "lights_on"
  | "damage"
  | "towing_risk"
  | "found_item"
  | "arrange_return"
  | "other";

export type Tag = {
  code: string;
  status: "unclaimed" | "active" | "disabled";
  userId: string | null;
  kind: TagKind;
  label: string | null;
  ownerEmail: string | null;
  note: string | null;
  lang: string;
  epoch: number;
  createdAt: number;
  claimedAt: number | null;
};

export type Message = {
  id: string;
  tagCode: string;
  body: string;
  translatedBody: string | null;
  finderLang: string | null;
  category: Category;
  urgency: Urgency;
  summary: string | null;
  quickReplies: string[];
  blocked: boolean;
  blockReason: string | null;
  finderContact: string | null;
  finderWhere: string | null;
  lat: number | null;
  lng: number | null;
  status: "new" | "handled";
  aiSource: "claude" | "rules";
  createdAt: number;
  replies: { id: string; body: string; createdAt: number }[];
};

type Row = Record<string, unknown>;

function toTag(r: Row): Tag {
  return {
    code: String(r.code),
    status: r.status === "active" ? "active" : r.status === "disabled" ? "disabled" : "unclaimed",
    userId: (r.user_id as string | null) ?? null,
    kind: (r.kind as TagKind) ?? "car",
    label: (r.label as string | null) ?? null,
    ownerEmail: (r.owner_email as string | null) ?? null,
    note: (r.note as string | null) ?? null,
    lang: String(r.lang ?? "en"),
    epoch: Number(r.manage_epoch ?? 0),
    createdAt: Number(r.created_at),
    claimedAt: r.claimed_at == null ? null : Number(r.claimed_at),
  };
}

/** Random code and PIN pairs. Nothing is stored; see importTags. */
export function generateCodes(count: number): { code: string; pin: string }[] {
  const out: { code: string; pin: string }[] = [];
  const seen = new Set<string>();
  while (out.length < count) {
    const code = newCode();
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({ code, pin: newPin() });
  }
  return out;
}

/**
 * Register code and PIN pairs as unclaimed tags. PINs are stored hashed with this
 * environment's APP_SECRET. Codes that already exist are skipped, so re-importing is safe.
 */
export async function importTags(rows: { code: string; pin: string }[], kind: TagKind, batch: string) {
  const c = await db();
  const now = Date.now();
  const before = await c.execute("SELECT COUNT(*) AS n FROM tags");
  await c.batch(
    rows.map((t) => ({
      sql: "INSERT OR IGNORE INTO tags (code, pin_hash, kind, batch, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [t.code, hash(`pin:${t.code}:${t.pin}`), kind, batch, now],
    })),
    "write",
  );
  const after = await c.execute("SELECT COUNT(*) AS n FROM tags");
  const added = Number(after.rows[0].n) - Number(before.rows[0].n);
  return { added, skipped: rows.length - added };
}

/** Create a batch of unclaimed tags. PINs are returned once and stored hashed. */
export async function createTags(count: number, kind: TagKind, batch: string) {
  const out = generateCodes(count);
  await importTags(out, kind, batch);
  return out;
}

export async function getTag(code: string): Promise<Tag | null> {
  const c = await db();
  const r = await c.execute({ sql: "SELECT * FROM tags WHERE code = ?", args: [code] });
  return r.rows[0] ? toTag(r.rows[0] as Row) : null;
}

export async function getTagByManageToken(token: string): Promise<Tag | null> {
  const code = manageTokenCode(token);
  if (!code) return null;
  const c = await db();
  const r = await c.execute({ sql: "SELECT * FROM tags WHERE code = ? AND status = 'active'", args: [code] });
  const row = r.rows[0] as Row | undefined;
  if (!row || !manageTokenValid(token, code, Number(row.manage_epoch))) return null;
  return toTag(row);
}

export type ClaimInput = {
  code: string;
  pin: string;
  label: string;
  email: string;
  note: string;
  lang: string;
};

export type ClaimResult =
  | { ok: true; manageToken: string }
  | { ok: false; error: "not_found" | "already_claimed" | "bad_pin" };

/** Activate a tag. The manage token is returned once; only its hash is stored. */
export async function claimTag(input: ClaimInput): Promise<ClaimResult> {
  const c = await db();
  const r = await c.execute({ sql: "SELECT * FROM tags WHERE code = ?", args: [input.code] });
  const row = r.rows[0] as Row | undefined;
  if (!row) return { ok: false, error: "not_found" };
  if (row.status === "active") return { ok: false, error: "already_claimed" };
  if (row.pin_hash !== hash(`pin:${input.code}:${input.pin}`)) return { ok: false, error: "bad_pin" };

  const res = await c.execute({
    sql: `UPDATE tags SET status = 'active', label = ?, owner_email = ?, note = ?, lang = ?,
          claimed_at = ? WHERE code = ? AND status = 'unclaimed'`,
    args: [input.label, input.email, input.note, input.lang, Date.now(), input.code],
  });
  if (res.rowsAffected === 0) return { ok: false, error: "already_claimed" };
  return { ok: true, manageToken: manageToken(input.code, Number(row.manage_epoch)) };
}

export type NewMessage = {
  tagCode: string;
  body: string;
  translatedBody: string | null;
  finderLang: string | null;
  category: Category;
  urgency: Urgency;
  summary: string | null;
  quickReplies: string[];
  blocked: boolean;
  blockReason: string | null;
  finderContact: string | null;
  finderWhere: string | null;
  lat: number | null;
  lng: number | null;
  aiSource: "claude" | "rules";
};

/** Store a finder message. Returns the id and the finder's private reply-check token. */
export async function insertMessage(m: NewMessage) {
  const c = await db();
  const id = newId();
  const replyToken = newToken();
  await c.execute({
    sql: `INSERT INTO messages (id, tag_code, body, translated_body, finder_lang, category, urgency,
          summary, quick_replies, blocked, block_reason, finder_contact, finder_where, lat, lng,
          reply_token_hash, ai_source, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, m.tagCode, m.body, m.translatedBody, m.finderLang, m.category, m.urgency, m.summary,
      JSON.stringify(m.quickReplies), m.blocked ? 1 : 0, m.blockReason, m.finderContact,
      m.finderWhere, m.lat, m.lng, hash(`reply:${replyToken}`), m.aiSource, Date.now(),
    ],
  });
  return { id, replyToken };
}

function toMessage(r: Row, replies: Message["replies"]): Message {
  let quick: string[] = [];
  try {
    quick = JSON.parse(String(r.quick_replies ?? "[]"));
  } catch {
    quick = [];
  }
  return {
    id: String(r.id),
    tagCode: String(r.tag_code),
    body: String(r.body),
    translatedBody: (r.translated_body as string | null) ?? null,
    finderLang: (r.finder_lang as string | null) ?? null,
    category: r.category as Category,
    urgency: r.urgency as Urgency,
    summary: (r.summary as string | null) ?? null,
    quickReplies: quick,
    blocked: Number(r.blocked) === 1,
    blockReason: (r.block_reason as string | null) ?? null,
    finderContact: (r.finder_contact as string | null) ?? null,
    finderWhere: (r.finder_where as string | null) ?? null,
    lat: r.lat == null ? null : Number(r.lat),
    lng: r.lng == null ? null : Number(r.lng),
    status: r.status === "handled" ? "handled" : "new",
    aiSource: r.ai_source === "claude" ? "claude" : "rules",
    createdAt: Number(r.created_at),
    replies,
  };
}

export async function listMessages(tagCode: string): Promise<Message[]> {
  const c = await db();
  const [msgs, reps] = await Promise.all([
    c.execute({ sql: "SELECT * FROM messages WHERE tag_code = ? ORDER BY created_at DESC LIMIT 200", args: [tagCode] }),
    c.execute({
      sql: `SELECT r.* FROM replies r JOIN messages m ON m.id = r.message_id
            WHERE m.tag_code = ? ORDER BY r.created_at ASC`,
      args: [tagCode],
    }),
  ]);
  const byMessage = new Map<string, Message["replies"]>();
  for (const r of reps.rows as Row[]) {
    const list = byMessage.get(String(r.message_id)) ?? [];
    list.push({ id: String(r.id), body: String(r.body), createdAt: Number(r.created_at) });
    byMessage.set(String(r.message_id), list);
  }
  return (msgs.rows as Row[]).map((r) => toMessage(r, byMessage.get(String(r.id)) ?? []));
}

export async function getMessageByReplyToken(token: string) {
  const c = await db();
  const r = await c.execute({
    sql: "SELECT * FROM messages WHERE reply_token_hash = ?",
    args: [hash(`reply:${token}`)],
  });
  const row = r.rows[0] as Row | undefined;
  if (!row) return null;
  const reps = await c.execute({
    sql: "SELECT * FROM replies WHERE message_id = ? ORDER BY created_at ASC",
    args: [row.id as string],
  });
  const message = toMessage(
    row,
    (reps.rows as Row[]).map((x) => ({ id: String(x.id), body: String(x.body), createdAt: Number(x.created_at) })),
  );
  const tag = await getTag(message.tagCode);
  return { message, tag };
}

/** Add a reply; the caller must already have proven ownership of the tag. */
export async function addReply(tagCode: string, messageId: string, body: string): Promise<boolean> {
  const c = await db();
  const own = await c.execute({
    sql: "SELECT 1 FROM messages WHERE id = ? AND tag_code = ? AND blocked = 0",
    args: [messageId, tagCode],
  });
  if (!own.rows[0]) return false;
  await c.batch(
    [
      { sql: "INSERT INTO replies (id, message_id, body, created_at) VALUES (?, ?, ?, ?)", args: [newId(), messageId, body, Date.now()] },
      { sql: "UPDATE messages SET status = 'handled' WHERE id = ?", args: [messageId] },
    ],
    "write",
  );
  return true;
}

export async function markHandled(tagCode: string, messageId: string) {
  const c = await db();
  await c.execute({
    sql: "UPDATE messages SET status = 'handled' WHERE id = ? AND tag_code = ?",
    args: [messageId, tagCode],
  });
}

export async function updateTagSettings(code: string, s: { label: string; email: string; note: string; lang: string }) {
  const c = await db();
  await c.execute({
    sql: "UPDATE tags SET label = ?, owner_email = ?, note = ?, lang = ? WHERE code = ? AND status = 'active'",
    args: [s.label, s.email, s.note, s.lang, code],
  });
}

// ---------------------------------------------------------------------------
// Accounts: tags belong to a signed-in user.
// ---------------------------------------------------------------------------

export type PinCheck = { ok: true } | { ok: false; error: "not_found" | "already_claimed" | "bad_pin" };

/** Verify a tag code and PIN without claiming it. */
export async function checkPin(code: string, pin: string): Promise<PinCheck> {
  const c = await db();
  const r = await c.execute({ sql: "SELECT pin_hash, status FROM tags WHERE code = ?", args: [code] });
  const row = r.rows[0] as Row | undefined;
  if (!row) return { ok: false, error: "not_found" };
  if (row.status !== "unclaimed") return { ok: false, error: "already_claimed" };
  if (row.pin_hash !== hash(`pin:${code}:${pin}`)) return { ok: false, error: "bad_pin" };
  return { ok: true };
}

export type Activation = { code: string; userId: string; email: string; label: string; note: string; lang: string };

/** Attach an unclaimed tag to a user. Atomic: only one caller can win. */
export async function activateTagForUser(a: Activation): Promise<boolean> {
  const c = await db();
  const res = await c.execute({
    sql: `UPDATE tags SET status = 'active', user_id = ?, owner_email = ?, label = ?, note = ?, lang = ?,
          claimed_at = ? WHERE code = ? AND status = 'unclaimed'`,
    args: [a.userId, a.email, a.label, a.note, a.lang, Date.now(), a.code],
  });
  return res.rowsAffected === 1;
}

/** Add another tag to an account that is already signed in. */
export async function claimTagWithPin(a: Activation & { pin: string }): Promise<PinCheck> {
  const check = await checkPin(a.code, a.pin);
  if (!check.ok) return check;
  return (await activateTagForUser(a)) ? { ok: true } : { ok: false, error: "already_claimed" };
}

export type OwnedTag = Tag & { unread: number };

export async function listTagsForUser(userId: string): Promise<OwnedTag[]> {
  const c = await db();
  const r = await c.execute({
    sql: `SELECT t.*, (SELECT COUNT(*) FROM messages m
                       WHERE m.tag_code = t.code AND m.blocked = 0 AND m.status = 'new') AS unread
          FROM tags t WHERE t.user_id = ? AND t.status = 'active' ORDER BY t.claimed_at DESC`,
    args: [userId],
  });
  return r.rows.map((row) => ({ ...toTag(row as Row), unread: Number((row as Row).unread ?? 0) }));
}

export async function getTagForUser(code: string, userId: string): Promise<Tag | null> {
  const c = await db();
  const r = await c.execute({
    sql: "SELECT * FROM tags WHERE code = ? AND user_id = ? AND status = 'active'",
    args: [code, userId],
  });
  return r.rows[0] ? toTag(r.rows[0] as Row) : null;
}

export async function updateTagForUser(code: string, userId: string, s: { label: string; note: string; lang: string }) {
  const c = await db();
  const res = await c.execute({
    sql: "UPDATE tags SET label = ?, note = ?, lang = ? WHERE code = ? AND user_id = ? AND status = 'active'",
    args: [s.label, s.note, s.lang, code, userId],
  });
  return res.rowsAffected === 1;
}

/**
 * Delete a tag from an account. The code is never reused: the sticker stays
 * burned, scanning it shows "no longer active", and old inbox links stop working.
 */
export async function disableTag(code: string, userId: string): Promise<boolean> {
  const c = await db();
  const res = await c.execute({
    sql: `UPDATE tags SET status = 'disabled', manage_epoch = manage_epoch + 1, owner_email = NULL,
          label = NULL, note = NULL WHERE code = ? AND user_id = ? AND status = 'active'`,
    args: [code, userId],
  });
  return res.rowsAffected === 1;
}

/** Tags activated before accounts existed are linked once the owner proves the email. */
export async function linkLegacyTags(userId: string, email: string): Promise<number> {
  const c = await db();
  const res = await c.execute({
    sql: "UPDATE tags SET user_id = ? WHERE user_id IS NULL AND status = 'active' AND lower(owner_email) = ?",
    args: [userId, email.toLowerCase()],
  });
  return res.rowsAffected;
}

/** Remove an account: its tags are deactivated and their messages erased. */
export async function deleteAccountData(userId: string): Promise<void> {
  const c = await db();
  const codes = (await c.execute({ sql: "SELECT code FROM tags WHERE user_id = ?", args: [userId] })).rows.map((r) =>
    String((r as Row).code),
  );
  for (const code of codes) {
    await c.execute({
      sql: "DELETE FROM replies WHERE message_id IN (SELECT id FROM messages WHERE tag_code = ?)",
      args: [code],
    });
    await c.execute({ sql: "DELETE FROM messages WHERE tag_code = ?", args: [code] });
  }
  await c.execute({
    sql: `UPDATE tags SET status = 'disabled', manage_epoch = manage_epoch + 1, owner_email = NULL,
          label = NULL, note = NULL, user_id = NULL WHERE user_id = ?`,
    args: [userId],
  });
}
