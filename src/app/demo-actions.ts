"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { analyzeMessage } from "@/lib/ai";
import { allow, ipKey } from "@/lib/rate";

export type DemoResult =
  | {
      ok: true;
      safe: boolean;
      blockReason: string | null;
      category: string;
      urgency: "urgent" | "normal" | "low";
      language: string;
      translation: string | null;
      summary: string;
      quickReplies: string[];
      source: "claude" | "rules";
    }
  | { ok: false; error: string };

const schema = z.object({
  body: z.string().trim().min(3, "Type a message first.").max(300, "Keep it under 300 characters."),
  ownerLang: z.enum(["en", "es"]).default("en"),
});

/** Public playground for the landing page: runs the real analysis, stores nothing. */
export async function tryItAction(input: { body: string; ownerLang?: string }): Promise<DemoResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const h = await headers();
  if (!(await allow(`demo:${ipKey(h.get("x-forwarded-for"))}`, 12, 3600))) {
    return { ok: false, error: "That is the demo limit for now. Try again in an hour." };
  }
  const a = await analyzeMessage({ body: parsed.data.body, kind: "car", ownerLang: parsed.data.ownerLang });
  return {
    ok: true,
    safe: a.safe,
    blockReason: a.blockReason,
    category: a.category,
    urgency: a.urgency,
    language: a.language,
    translation: a.translation,
    summary: a.summary,
    quickReplies: a.quickReplies,
    source: a.source,
  };
}
