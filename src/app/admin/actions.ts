"use server";

import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { isKind } from "@/lib/kinds";
import { allow, ipKey } from "@/lib/rate";
import { importTags } from "@/lib/tags";

export type AdminState = { error?: string; ok?: string; csv?: string };

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Load printed sticker codes (codes.csv from `npm run batch -- --offline`) into this site's database. */
export async function importCodesAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const csv = String(formData.get("csv") ?? "");
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return { error: "ADMIN_TOKEN is not set on the server.", csv };
  const h = await headers();
  if (!(await allow(`admin:${ipKey(h.get("x-forwarded-for") ?? h.get("x-real-ip"))}`, 10, 3600))) {
    return { error: "Too many attempts. Try again in an hour.", csv };
  }
  if (!same(String(formData.get("token") ?? ""), expected)) return { error: "Wrong admin token.", csv };

  const kind = String(formData.get("kind") ?? "car");
  if (!isKind(kind)) return { error: "Unknown tag kind.", csv };
  const batch = String(formData.get("batch") ?? "").replace(/[^\w-]/g, "-").slice(0, 40) || "import";

  const rows: { code: string; pin: string }[] = [];
  for (const line of csv.split(/\r?\n/)) {
    const [code, pin] = line.split(",").map((s) => s.trim());
    if (!code || code.toLowerCase() === "code") continue;
    if (!/^[2-9A-HJKMNP-Z]{8}$/.test(code)) return { error: `Bad code on line: ${line.slice(0, 40)}`, csv };
    if (!/^\d{6}$/.test(pin ?? "")) return { error: `Bad PIN for code ${code}`, csv };
    rows.push({ code, pin });
  }
  if (rows.length === 0) return { error: "No rows found. Paste the codes.csv contents.", csv };
  if (rows.length > 2000) return { error: "At most 2000 rows at a time.", csv };

  const { added, skipped } = await importTags(rows, kind, batch);
  return { ok: `Added ${added} tags${skipped ? `, skipped ${skipped} that already existed` : ""}.` };
}
