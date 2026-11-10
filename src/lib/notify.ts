import { db } from "./db";
import { newId } from "./ids";
import { appUrl } from "./url";

/**
 * Owner alerts. With RESEND_API_KEY set, email is sent through Resend.
 * Without it (local development) emails are written to the outbox table and
 * shown at /dev/outbox, so the whole flow can be demoed with no accounts.
 */

export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "TagBack <alerts@example.com>",
        to,
        subject,
        text: body,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      console.error("Email send failed:", res.status, await res.text());
      return false;
    }
    return true;
  }
  if (process.env.NODE_ENV === "production") {
    console.error("RESEND_API_KEY is not set: email was not sent.");
    return false;
  }
  const c = await db();
  await c.execute({
    sql: "INSERT INTO outbox (id, to_email, subject, body, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [newId(), to, subject, body, Date.now()],
  });
  return true;
}

export async function sendManageLink(to: string, label: string, token: string) {
  const link = `${appUrl()}/m/${token}`;
  await sendEmail(
    to,
    `Your TagBack inbox for ${label}`,
    `Your tag "${label}" is active.\n\nYour private inbox link (keep it safe, anyone with it can read your messages):\n${link}\n`,
  );
}

export async function sendOwnerAlert(opts: {
  to: string;
  label: string;
  urgency: "urgent" | "normal" | "low";
  summary: string;
  manageToken: string;
}) {
  const prefix = opts.urgency === "urgent" ? "URGENT: " : "";
  await sendEmail(
    opts.to,
    `${prefix}Someone scanned ${opts.label}`,
    `${opts.summary}\n\nRead and reply: ${appUrl()}/m/${opts.manageToken}\n`,
  );
}

export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  return sendEmail(
    to,
    `${code} is your TagBack code`,
    `Your TagBack sign-in code is ${code}\n\nIt expires in 10 minutes. If you did not ask for it, you can ignore this email.\n`,
  );
}
