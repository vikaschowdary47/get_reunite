import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Narrow, requestTime, Skeleton, timeAgo } from "@/components/chrome";
import { getMessageByReplyToken } from "@/lib/tags";

export const metadata: Metadata = {
  title: "Message sent",
  robots: { index: false, follow: false },
};

export default function ReplyPage(props: PageProps<"/r/[token]">) {
  return (
    <Narrow>
      <Suspense fallback={<Skeleton />}>
        <Thread params={props.params} />
      </Suspense>
    </Narrow>
  );
}

async function Thread({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await connection();
  const found = await getMessageByReplyToken(token);
  if (!found) notFound();
  const { message, tag } = found;
  const now = requestTime();

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <h1 className="text-4xl font-semibold sm:text-5xl">Sent to the owner</h1>
        <p className="text-lg text-muted">
          {tag?.label ? `The owner of ${tag.label} has been alerted.` : "The owner has been alerted."} Keep this page
          open or come back to it. Their reply will show up here.
        </p>
      </div>

      <section aria-label="Your message" className="card p-4">
        <p className="hint mb-1">You wrote, {timeAgo(message.createdAt, now)}</p>
        <p className="whitespace-pre-wrap">{message.body}</p>
      </section>

      {message.replies.length > 0 ? (
        <section aria-label="Owner reply" className="grid gap-3">
          {message.replies.map((r) => (
            <div key={r.id} className="plaque bg-sign text-white">
              <div className="grid gap-1 p-4">
                <p className="font-semibold">Owner replied, {timeAgo(r.createdAt, now)}</p>
                <p className="text-2xl font-semibold">{r.body}</p>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="grid gap-3">
          <p className="font-semibold">No reply yet.</p>
          <div>
            <Link href={`/r/${token}`} prefetch={false} className="btn btn-plain btn-sm">
              Check for a reply
            </Link>
          </div>
          {!message.finderContact && (
            <p className="hint">You did not leave a phone or email, so this page is the only way they can answer.</p>
          )}
        </div>
      )}
    </div>
  );
}
