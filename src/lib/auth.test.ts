import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkOtp, createOtp, createSession, deleteSession, getOtp, upsertUser, userFromSession } from "./auth";
import { db, resetDbForTests } from "./db";
import {
  activateTagForUser,
  checkPin,
  claimTag,
  claimTagWithPin,
  createTags,
  deleteAccountData,
  disableTag,
  getTag,
  getTagForUser,
  insertMessage,
  linkLegacyTags,
  listMessages,
  listTagsForUser,
  updateTagForUser,
} from "./tags";

let dir: string;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "tagback-auth-"));
  process.env.TURSO_DATABASE_URL = `file:${path.join(dir, "auth.db")}`;
  process.env.APP_SECRET = "test-secret";
  resetDbForTests();
});

afterAll(() => {
  resetDbForTests();
  fs.rmSync(dir, { recursive: true, force: true });
});

const msg = (tagCode: string) => ({
  tagCode,
  body: "hello",
  translatedBody: null,
  finderLang: "en",
  category: "other" as const,
  urgency: "normal" as const,
  summary: "hello",
  quickReplies: [],
  blocked: false,
  blockReason: null,
  finderContact: null,
  finderWhere: null,
  lat: null,
  lng: null,
  aiSource: "rules" as const,
});

describe("email codes", () => {
  it("accepts the right code once and stores only a hash", async () => {
    const { id, code } = await createOtp("A@Example.com", null);
    const c = await db();
    const row = (await c.execute({ sql: "SELECT * FROM otps WHERE id = ?", args: [id] })).rows[0];
    expect(String(row.code_hash)).not.toContain(code);
    expect(row.email).toBe("a@example.com");

    const ok = await checkOtp(id, code);
    expect(ok).toMatchObject({ ok: true, email: "a@example.com" });
    expect(await checkOtp(id, code)).toMatchObject({ ok: false, reason: "missing" });
  });

  it("locks after five wrong guesses, even if the next one is right", async () => {
    const { id, code } = await createOtp("b@example.com", null);
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) expect(await checkOtp(id, wrong)).toMatchObject({ ok: false, reason: "wrong" });
    expect(await checkOtp(id, code)).toMatchObject({ ok: false, reason: "locked" });
  });

  it("reports how many tries are left", async () => {
    const { id, code } = await createOtp("c@example.com", null);
    const wrong = code === "000000" ? "111111" : "000000";
    expect(await checkOtp(id, wrong)).toMatchObject({ ok: false, reason: "wrong", left: 4 });
  });

  it("rejects an expired code", async () => {
    const { id, code } = await createOtp("d@example.com", null);
    const c = await db();
    await c.execute({ sql: "UPDATE otps SET expires_at = ? WHERE id = ?", args: [Date.now() - 1, id] });
    expect(await checkOtp(id, code)).toMatchObject({ ok: false, reason: "expired" });
    expect((await getOtp(id))?.expired).toBe(true);
  });

  it("carries the pending tag claim through", async () => {
    const payload = { code: "ABCD2345", label: "Civic", note: "", lang: "en" };
    const { id, code } = await createOtp("e@example.com", payload);
    const res = await checkOtp(id, code);
    expect(res.ok && res.payload).toEqual(payload);
  });
});

describe("sessions", () => {
  it("signs a user in, stores only a hash, and signs out", async () => {
    const user = await upsertUser("Sess@Example.com");
    const token = await createSession(user.id);
    const c = await db();
    const stored = (await c.execute("SELECT token_hash FROM sessions")).rows.map((r) => String(r.token_hash));
    expect(stored).not.toContain(token);
    expect((await userFromSession(token))?.email).toBe("sess@example.com");
    await deleteSession(token);
    expect(await userFromSession(token)).toBeNull();
  });

  it("does not accept a garbage or expired token", async () => {
    expect(await userFromSession("nope")).toBeNull();
    const user = await upsertUser("old@example.com");
    const token = await createSession(user.id);
    const c = await db();
    await c.execute({ sql: "UPDATE sessions SET expires_at = ?", args: [Date.now() - 1] });
    expect(await userFromSession(token)).toBeNull();
  });

  it("returns the same user for the same email", async () => {
    const a = await upsertUser("same@example.com");
    const b = await upsertUser("SAME@example.com");
    expect(a.id).toBe(b.id);
  });
});

describe("tags on an account", () => {
  it("checks the PIN without claiming, then activates once", async () => {
    const [t] = await createTags(1, "car", "t1");
    const user = await upsertUser("owner1@example.com");
    expect(await checkPin(t.code, "000000")).toMatchObject({ ok: false });
    expect(await checkPin(t.code, t.pin)).toEqual({ ok: true });
    expect((await getTag(t.code))?.status).toBe("unclaimed");

    const act = { code: t.code, userId: user.id, email: user.email, label: "Civic", note: "hi", lang: "en" };
    expect(await activateTagForUser(act)).toBe(true);
    expect(await activateTagForUser(act)).toBe(false);
    expect((await listTagsForUser(user.id)).map((x) => x.code)).toEqual([t.code]);
  });

  it("lets an account add a second tag with its PIN, and refuses a wrong PIN", async () => {
    const [a, b] = await createTags(2, "laptop", "t2");
    const user = await upsertUser("owner2@example.com");
    const base = { userId: user.id, email: user.email, label: "L", note: "", lang: "en" };
    expect(await claimTagWithPin({ ...base, code: a.code, pin: "999999" })).toMatchObject({ ok: false, error: "bad_pin" });
    expect(await claimTagWithPin({ ...base, code: a.code, pin: a.pin })).toEqual({ ok: true });
    expect(await claimTagWithPin({ ...base, code: b.code, pin: b.pin })).toEqual({ ok: true });
    expect(await listTagsForUser(user.id)).toHaveLength(2);
  });

  it("never lets one account see or edit another account's tag", async () => {
    const [t] = await createTags(1, "car", "t3");
    const owner = await upsertUser("owner3@example.com");
    const other = await upsertUser("other3@example.com");
    await activateTagForUser({ code: t.code, userId: owner.id, email: owner.email, label: "Mine", note: "", lang: "en" });

    expect(await getTagForUser(t.code, other.id)).toBeNull();
    expect(await updateTagForUser(t.code, other.id, { label: "Hacked", note: "", lang: "en" })).toBe(false);
    expect(await disableTag(t.code, other.id)).toBe(false);
    expect((await getTag(t.code))?.label).toBe("Mine");
  });

  it("edits what finders see", async () => {
    const [t] = await createTags(1, "car", "t4");
    const u = await upsertUser("owner4@example.com");
    await activateTagForUser({ code: t.code, userId: u.id, email: u.email, label: "Old", note: "", lang: "en" });
    expect(await updateTagForUser(t.code, u.id, { label: "New name", note: "Back soon", lang: "es" })).toBe(true);
    expect(await getTag(t.code)).toMatchObject({ label: "New name", note: "Back soon", lang: "es" });
  });

  it("deleting a tag keeps the code burned and revokes the inbox link", async () => {
    const [t] = await createTags(1, "car", "t5");
    const u = await upsertUser("owner5@example.com");
    await activateTagForUser({ code: t.code, userId: u.id, email: u.email, label: "Gone", note: "", lang: "en" });
    const before = (await getTag(t.code))!;
    expect(await disableTag(t.code, u.id)).toBe(true);
    const after = (await getTag(t.code))!;
    expect(after.status).toBe("disabled");
    expect(after.epoch).toBe(before.epoch + 1);
    expect(after.ownerEmail).toBeNull();
    expect(await listTagsForUser(u.id)).toHaveLength(0);
    // the sticker cannot be activated again
    expect(await checkPin(t.code, t.pin)).toMatchObject({ ok: false, error: "already_claimed" });
  });

  it("links tags activated before accounts existed once the email is proven", async () => {
    const [t] = await createTags(1, "car", "t6");
    await claimTag({ code: t.code, pin: t.pin, label: "Legacy", email: "Legacy@Example.com", note: "", lang: "en" });
    const u = await upsertUser("legacy@example.com");
    expect(await linkLegacyTags(u.id, u.email)).toBe(1);
    expect((await listTagsForUser(u.id))[0].label).toBe("Legacy");
    const stranger = await upsertUser("stranger@example.com");
    expect(await linkLegacyTags(stranger.id, stranger.email)).toBe(0);
  });

  it("counts unread messages per tag", async () => {
    const [t] = await createTags(1, "car", "t7");
    const u = await upsertUser("owner7@example.com");
    await activateTagForUser({ code: t.code, userId: u.id, email: u.email, label: "Inbox", note: "", lang: "en" });
    await insertMessage(msg(t.code));
    await insertMessage(msg(t.code));
    expect((await listTagsForUser(u.id))[0].unread).toBe(2);
  });

  it("deleting an account erases messages and deactivates the tags", async () => {
    const [t] = await createTags(1, "car", "t8");
    const u = await upsertUser("owner8@example.com");
    await activateTagForUser({ code: t.code, userId: u.id, email: u.email, label: "Bye", note: "", lang: "en" });
    await insertMessage(msg(t.code));
    await deleteAccountData(u.id);
    expect(await listMessages(t.code)).toHaveLength(0);
    expect(await getTag(t.code)).toMatchObject({ status: "disabled", ownerEmail: null, label: null, userId: null });
  });
});
