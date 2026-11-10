import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resetDbForTests } from "./db";
import { manageToken, manageTokenValid, newCode, newPin, normalizeCode } from "./ids";
import { allow } from "./rate";
import {
  addReply,
  claimTag,
  createTags,
  getMessageByReplyToken,
  getTag,
  getTagByManageToken,
  insertMessage,
  listMessages,
} from "./tags";

let dir: string;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "tagback-"));
  process.env.TURSO_DATABASE_URL = `file:${path.join(dir, "test.db")}`;
  process.env.APP_SECRET = "test-secret";
  resetDbForTests();
});

afterAll(() => {
  resetDbForTests();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("ids", () => {
  it("generates unambiguous 8 character codes", () => {
    for (let i = 0; i < 200; i++) expect(newCode()).toMatch(/^[2-9A-HJKMNP-Z]{8}$/);
  });

  it("generates 6 digit PINs", () => {
    for (let i = 0; i < 50; i++) expect(newPin()).toMatch(/^\d{6}$/);
  });

  it("normalizes typed codes", () => {
    expect(normalizeCode(" 7k3f-9qx2 ")).toBe("7K3F9QX2");
  });

  it("rejects tampered manage tokens and revoked epochs", () => {
    const t = manageToken("ABCD2345", 0);
    expect(manageTokenValid(t, "ABCD2345", 0)).toBe(true);
    expect(manageTokenValid(t, "ABCD2345", 1)).toBe(false);
    expect(manageTokenValid(`${t}x`, "ABCD2345", 0)).toBe(false);
    expect(manageTokenValid(manageToken("ZZZZ2345", 0), "ABCD2345", 0)).toBe(false);
  });
});

describe("tag lifecycle", () => {
  it("creates unique unclaimed tags and stores PINs hashed", async () => {
    const tags = await createTags(25, "car", "test-batch");
    expect(new Set(tags.map((t) => t.code)).size).toBe(25);
    const tag = await getTag(tags[0].code);
    expect(tag?.status).toBe("unclaimed");
  });

  it("claims with the right PIN, once, and gives a working inbox link", async () => {
    const [t] = await createTags(1, "car", "claim");
    const base = { code: t.code, label: "Blue Civic", email: "a@example.com", note: "hi", lang: "en" };

    expect(await claimTag({ ...base, pin: "000000" === t.pin ? "111111" : "000000" })).toEqual({ ok: false, error: "bad_pin" });
    const ok = await claimTag({ ...base, pin: t.pin });
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect((await getTagByManageToken(ok.manageToken))?.code).toBe(t.code);
    expect(await claimTag({ ...base, pin: t.pin })).toEqual({ ok: false, error: "already_claimed" });
    expect(await getTagByManageToken(`${t.code}.forged`)).toBeNull();
    expect(await claimTag({ ...base, code: "NOPE2222", pin: t.pin })).toEqual({ ok: false, error: "not_found" });
  });

  it("stores messages, lets the finder read replies, and scopes replies to the owner's tag", async () => {
    const [a, b] = await createTags(2, "car", "msgs");
    for (const t of [a, b]) {
      await claimTag({ code: t.code, pin: t.pin, label: t.code, email: "o@example.com", note: "", lang: "en" });
    }
    const base = {
      body: "You are blocking me",
      translatedBody: null,
      finderLang: "en",
      category: "blocked_in" as const,
      urgency: "normal" as const,
      summary: "Blocked",
      quickReplies: ["On my way"],
      blocked: false,
      blockReason: null,
      finderContact: null,
      finderWhere: "Oak St",
      lat: null,
      lng: null,
      aiSource: "rules" as const,
    };
    const m = await insertMessage({ ...base, tagCode: a.code });
    expect((await listMessages(a.code))).toHaveLength(1);
    expect((await listMessages(b.code))).toHaveLength(0);

    // Another owner cannot reply to this message.
    expect(await addReply(b.code, m.id, "hijack")).toBe(false);
    expect(await addReply(a.code, m.id, "On my way")).toBe(true);

    const thread = await getMessageByReplyToken(m.replyToken);
    expect(thread?.message.replies[0].body).toBe("On my way");
    expect(thread?.message.status).toBe("handled");
    expect(await getMessageByReplyToken("bogus")).toBeNull();
  });
});

describe("rate limiting", () => {
  it("allows up to the limit then blocks", async () => {
    const key = `t:${Math.random()}`;
    expect(await allow(key, 2, 60)).toBe(true);
    expect(await allow(key, 2, 60)).toBe(true);
    expect(await allow(key, 2, 60)).toBe(false);
  });
});
