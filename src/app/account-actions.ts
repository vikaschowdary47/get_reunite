"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkOtp, createOtp, getOtp, normalizeEmail, upsertUser, deleteUser, type OtpPayload } from "@/lib/auth";
import { normalizeCode } from "@/lib/ids";
import { LANG_CODES } from "@/lib/langs";
import { sendOtpEmail } from "@/lib/notify";
import { allow, ipKey } from "@/lib/rate";
import { clearPending, endSession, getPending, requireUser, setPending, setSessionCookie } from "@/lib/session";
import {
  activateTagForUser,
  checkPin,
  claimTagWithPin,
  deleteAccountData,
  disableTag,
  linkLegacyTags,
  updateTagForUser,
} from "@/lib/tags";
import type { FormState } from "./actions";

async function clientKey() {
  const h = await headers();
  return ipKey(h.get("x-forwarded-for") ?? h.get("x-real-ip"));
}

const PIN_ERRORS = {
  not_found: "We could not find that tag.",
  already_claimed: "This tag is already activated.",
  bad_pin: "That PIN does not match this tag. Check the card in the packaging.",
} as const;

const tagFields = {
  label: z.string().trim().min(1, "Give your tag a name.").max(40),
  note: z.string().trim().max(200).default(""),
  lang: z.enum(LANG_CODES).default("en"),
};
const emailField = z.string().trim().email("Enter a valid email address.").max(120);
const pinField = z.string().regex(/^\d{6}$/, "The activation PIN is 6 digits.");
const codeField = z.string().min(4).max(16);

/** Send a sign-in code and move to the verify screen. */
async function sendCode(email: string, payload: OtpPayload | null): Promise<FormState | never> {
  const ip = await clientKey();
  const e = normalizeEmail(email);
  if (!(await allow(`otp:email:${e}`, 5, 3600)) || !(await allow(`otp:ip:${ip}`, 12, 3600))) {
    return { error: "Too many codes requested. Try again in an hour." };
  }
  const { id, code } = await createOtp(e, payload);
  if (!(await sendOtpEmail(e, code))) return { error: "We could not send the email. Try again in a minute." };
  await setPending(id);
  redirect("/verify");
}

// --- first tag: PIN checked now, tag attached once the email code is entered ---

const startClaimSchema = z.object({ code: codeField, pin: pinField, email: emailField, ...tagFields });

export async function startClaimAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = startClaimSchema.safeParse({
    ...Object.fromEntries(formData),
    code: normalizeCode(String(formData.get("code") ?? "")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;

  if (!(await allow(`claim:${await clientKey()}:${v.code}`, 6, 3600))) {
    return { error: "Too many attempts. Try again in an hour." };
  }
  const check = await checkPin(v.code, v.pin);
  if (!check.ok) return { error: PIN_ERRORS[check.error] };

  return sendCode(v.email, { code: v.code, label: v.label, note: v.note, lang: v.lang });
}

// --- sign in ---

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailField.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return sendCode(parsed.data, null);
}

export async function verifyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.string().regex(/^\d{6}$/, "Enter the 6-digit code.").safeParse(String(formData.get("code") ?? "").replace(/\s/g, ""));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const otpId = await getPending();
  if (!otpId) return { error: "That code expired. Request a new one." };

  const res = await checkOtp(otpId, parsed.data);
  if (!res.ok) {
    if (res.reason === "wrong") {
      return { error: `That code does not match. ${res.left} ${res.left === 1 ? "try" : "tries"} left.` };
    }
    if (res.reason === "locked") return { error: "Too many wrong codes. Request a new one." };
    return { error: "That code expired. Request a new one." };
  }

  const user = await upsertUser(res.email);
  await linkLegacyTags(user.id, user.email);
  let claimed: string | null = null;
  if (res.payload) {
    const ok = await activateTagForUser({ ...res.payload, userId: user.id, email: user.email });
    if (ok) claimed = res.payload.code;
  }
  await setSessionCookie(user.id);
  await clearPending();
  redirect(claimed ? `/dashboard?activated=${claimed}` : "/dashboard");
}

export async function resendCodeAction(): Promise<void> {
  const id = await getPending();
  const otp = id ? await getOtp(id) : null;
  if (!otp) redirect("/signin");
  const ip = await clientKey();
  if (!(await allow(`otp:email:${otp.email}`, 5, 3600)) || !(await allow(`otp:ip:${ip}`, 12, 3600))) {
    redirect("/verify?limit=1");
  }
  const next = await createOtp(otp.email, otp.payload);
  await sendOtpEmail(otp.email, next.code);
  await setPending(next.id);
  redirect("/verify?sent=1");
}

export async function signOutAction(): Promise<void> {
  await endSession();
  redirect("/");
}

// --- tags on an account ---

const addTagSchema = z.object({ code: codeField, pin: pinField, ...tagFields });

export async function addTagAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = addTagSchema.safeParse({
    ...Object.fromEntries(formData),
    code: normalizeCode(String(formData.get("code") ?? "")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (!(await allow(`claim:${await clientKey()}:${v.code}`, 6, 3600))) {
    return { error: "Too many attempts. Try again in an hour." };
  }
  const res = await claimTagWithPin({ ...v, userId: user.id, email: user.email });
  if (!res.ok) return { error: PIN_ERRORS[res.error] };
  revalidatePath("/dashboard");
  redirect(`/dashboard?activated=${v.code}`);
}

const updateTagSchema = z.object({ code: codeField, ...tagFields });

export async function updateTagAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = updateTagSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { code, ...rest } = parsed.data;
  const ok = await updateTagForUser(code, user.id, rest);
  if (!ok) return { error: "We could not find that tag on your account." };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const code = normalizeCode(String(formData.get("code") ?? ""));
  if (code) await disableTag(code, user.id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") {
    return { error: "Type DELETE to confirm." };
  }
  await deleteAccountData(user.id);
  await endSession();
  await deleteUser(user.id);
  redirect("/?deleted=1");
}
