"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { analyzeMessage } from "@/lib/ai";
import { manageToken, normalizeCode } from "@/lib/ids";
import { sendOwnerAlert } from "@/lib/notify";
import { allow, ipKey } from "@/lib/rate";
import {
  addReply,
  getTag,
  getTagByManageToken,
  insertMessage,
  markHandled,
} from "@/lib/tags";

export type FormState = { error?: string; ok?: boolean };

const num = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(min).max(max).optional(),
  );

async function clientKey() {
  const h = await headers();
  return ipKey(h.get("x-forwarded-for") ?? h.get("x-real-ip"));
}

const messageSchema = z.object({
  code: z.string().min(4).max(16),
  body: z.string().trim().min(3, "Write a short message first.").max(500, "Keep it under 500 characters."),
  where: z.string().trim().max(120).default(""),
  contact: z.string().trim().max(80).default(""),
  lat: num(-90, 90),
  lng: num(-180, 180),
  website: z.string().max(0).optional(), // honeypot: real people leave it empty
});

export async function sendMessageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = messageSchema.safeParse({
    ...Object.fromEntries(formData),
    code: normalizeCode(String(formData.get("code") ?? "")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;

  const tag = await getTag(v.code);
  if (!tag || tag.status !== "active" || !tag.ownerEmail) {
    return { error: "This tag is not active, so it cannot receive messages." };
  }

  const okIp = await allow(`msg:${await clientKey()}:${v.code}`, 5, 3600);
  const okDay = await allow(`msgday:${v.code}`, 40, 86_400);
  if (!okIp || !okDay) {
    return { error: "Too many messages for this tag right now. Wait a bit and try again." };
  }

  const a = await analyzeMessage({ body: v.body, kind: tag.kind, ownerLang: tag.lang });
  const { replyToken } = await insertMessage({
    tagCode: tag.code,
    body: v.body,
    translatedBody: a.translation,
    finderLang: a.language,
    category: a.category,
    urgency: a.urgency,
    summary: a.summary,
    quickReplies: a.quickReplies,
    blocked: !a.safe,
    blockReason: a.blockReason,
    finderContact: v.contact || null,
    finderWhere: v.where || null,
    lat: v.lat ?? null,
    lng: v.lng ?? null,
    aiSource: a.source,
  });

  if (!a.safe) {
    return {
      error: `Your message was not delivered: ${a.blockReason?.toLowerCase() ?? "it may break our guidelines"}. Rephrase it and send again.`,
    };
  }

  try {
    await sendOwnerAlert({
      to: tag.ownerEmail,
      label: tag.label ?? "your tag",
      urgency: a.urgency,
      summary: a.summary || v.body.slice(0, 120),
      manageToken: manageToken(tag.code, tag.epoch),
    });
  } catch (err) {
    console.error("owner alert failed", err);
  }
  redirect(`/r/${replyToken}`);
}

const replySchema = z.object({
  token: z.string().min(10).max(80),
  messageId: z.string().min(4).max(40),
  body: z.string().trim().min(1).max(300),
});

export async function replyAction(formData: FormData): Promise<void> {
  const parsed = replySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { token, messageId, body } = parsed.data;
  const tag = await getTagByManageToken(token);
  if (!tag) return;
  if (!(await allow(`reply:${tag.code}`, 60, 3600))) return;
  await addReply(tag.code, messageId, body);
  revalidatePath(`/m/${token}`);
}

export async function handledAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const messageId = String(formData.get("messageId") ?? "");
  const tag = await getTagByManageToken(token);
  if (!tag || !messageId) return;
  await markHandled(tag.code, messageId);
  revalidatePath(`/m/${token}`);
}
