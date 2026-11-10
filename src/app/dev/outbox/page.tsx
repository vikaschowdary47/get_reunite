import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Narrow, Skeleton } from "@/components/chrome";
import { db } from "@/lib/db";

export const metadata = { title: "Dev outbox", robots: { index: false, follow: false } };

export default function OutboxPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Narrow wide>
      <h1 className="mb-2 text-4xl font-semibold">Dev outbox</h1>
      <p className="hint mb-8">
        Emails the app would have sent. This page exists only in development; in production, set RESEND_API_KEY.
      </p>
      <Suspense fallback={<Skeleton />}>
        <Emails />
      </Suspense>
    </Narrow>
  );
}

function linkify(text: string) {
  return text.split(/(https?:\/\/\S+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} className="font-bold underline underline-offset-4">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

async function Emails() {
  await connection();
  const c = await db();
  const r = await c.execute("SELECT * FROM outbox ORDER BY created_at DESC LIMIT 50");
  if (r.rows.length === 0) return <p className="card p-4">No emails yet.</p>;
  return (
    <div className="grid gap-4">
      {r.rows.map((row) => (
        <article key={String(row.id)} className="card p-4">
          <p className="hint">To {String(row.to_email)}</p>
          <h2 className="text-xl font-semibold">{String(row.subject)}</h2>
          <p className="mt-2 whitespace-pre-wrap break-words">{linkify(String(row.body))}</p>
        </article>
      ))}
    </div>
  );
}
