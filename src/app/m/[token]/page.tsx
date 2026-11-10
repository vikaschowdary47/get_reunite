import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { handledAction, replyAction } from "@/app/actions";
import { UrgencyBadge } from "@/components/badges";
import { Narrow, requestTime, Skeleton, timeAgo } from "@/components/chrome";
import { CATEGORY_LABEL } from "@/lib/labels";
import { appUrl } from "@/lib/url";
import { getTagByManageToken, listMessages, type Message } from "@/lib/tags";

export const metadata: Metadata = {
  title: "Your inbox",
  robots: { index: false, follow: false },
};

export default function InboxPage(props: PageProps<"/m/[token]">) {
  return (
    <Narrow wide>
      <Suspense fallback={<Skeleton />}>
        <Inbox params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </Narrow>
  );
}

const RING: Record<Message["urgency"], string> = {
  urgent: "ring-2 ring-alert/40",
  normal: "",
  low: "",
};

async function Inbox({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  await connection();
  const tag = await getTagByManageToken(token);
  if (!tag) notFound();

  const all = await listMessages(tag.code);
  const blocked = all.filter((m) => m.blocked).length;
  const messages = all.filter((m) => !m.blocked);
  const open = messages.filter((m) => m.status === "new");
  const done = messages.filter((m) => m.status === "handled");
  const now = requestTime();
  const welcome = sp.welcome === "1";

  return (
    <div className="grid gap-10">
      {welcome && (
        <div className="plaque bg-tow text-ink">
          <div className="grid gap-1 p-5">
            <h2 className="text-2xl font-semibold">Your tag is active</h2>
            <p>
              New messages are emailed to {tag.ownerEmail} with a link here. Anyone with that link can read this
              inbox, so do not forward those emails.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        <h1 className="text-4xl font-semibold sm:text-5xl">{tag.label}</h1>
        <p className="text-muted">
          Tag <span className="font-mono font-bold text-ink">{tag.code}</span>. Finders open{" "}
          <span className="font-mono text-ink">
            {appUrl().replace(/^https?:\/\//, "")}/t/{tag.code}
          </span>
        </p>
      </div>

      <section aria-labelledby="open-h" className="grid gap-5">
        <h2 id="open-h" className="text-2xl font-semibold">
          Needs a reply{open.length > 0 ? ` (${open.length})` : ""}
        </h2>
        {open.length === 0 ? (
          <p className="card p-5">
            Nothing waiting. When someone scans your tag, the message shows up here and in your email.
          </p>
        ) : (
          open.map((m) => <MessageCard key={m.id} m={m} token={token} now={now} />)
        )}
        {blocked > 0 && (
          <p className="hint">
            {blocked} message{blocked === 1 ? " was" : "s were"} blocked as abusive or spam and never shown to you.
          </p>
        )}
      </section>

      {done.length > 0 && (
        <section aria-labelledby="done-h" className="grid gap-4">
          <h2 id="done-h" className="text-2xl font-semibold">
            Handled
          </h2>
          {done.map((m) => (
            <div key={m.id} className="card p-4">
              <p className="hint">{timeAgo(m.createdAt, now)}</p>
              <p className="font-semibold">{m.summary || m.body}</p>
              {m.replies.map((r) => (
                <p key={r.id} className="mt-1 text-muted">
                  You replied: {r.body}
                </p>
              ))}
            </div>
          ))}
        </section>
      )}

      <p className="border-t border-line pt-5">
        <Link href={`/dashboard/t/${tag.code}`} className="font-semibold underline underline-offset-4">
          Edit this tag or manage your account
        </Link>{" "}
        <span className="hint">(you will sign in with an emailed code)</span>
      </p>
    </div>
  );
}

function MessageCard({ m, token, now }: { m: Message; token: string; now: number }) {
  const maps = m.lat != null && m.lng != null ? `https://www.google.com/maps?q=${m.lat},${m.lng}` : null;
  return (
    <article className={`card p-6 ${RING[m.urgency]}`}>
      <div className="flex flex-wrap items-center gap-3">
        <UrgencyBadge urgency={m.urgency} />
        <span className="font-semibold">{CATEGORY_LABEL[m.category]}</span>
        <span className="hint">{timeAgo(m.createdAt, now)}</span>
      </div>

      <p className="mt-3 text-2xl font-semibold leading-snug">{m.summary || m.body}</p>

      <div className="mt-3 grid gap-2">
        {m.translatedBody ? (
          <>
            <p className="whitespace-pre-wrap">{m.translatedBody}</p>
            <p className="hint whitespace-pre-wrap">
              Original{m.finderLang ? ` (${m.finderLang.toUpperCase()})` : ""}: {m.body}
            </p>
          </>
        ) : (
          <p className="whitespace-pre-wrap">{m.body}</p>
        )}
        {m.finderWhere && <p className="hint">Where: {m.finderWhere}</p>}
        {maps && (
          <p>
            <a href={maps} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
              Open the finder&apos;s location in Maps
            </a>
          </p>
        )}
        {m.finderContact && <p className="hint">They left: {m.finderContact}</p>}
      </div>

      {m.quickReplies.length > 0 && (
        <div className="mt-5">
          <p className="hint mb-2">One-tap reply</p>
          <div className="flex flex-wrap gap-2">
            {m.quickReplies.map((q) => (
              <form key={q} action={replyAction}>
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="messageId" value={m.id} />
                <input type="hidden" name="body" value={q} />
                <button className="btn btn-plain btn-sm">{q}</button>
              </form>
            ))}
          </div>
        </div>
      )}

      <form action={replyAction} className="mt-4 flex flex-wrap gap-2">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="messageId" value={m.id} />
        <label className="sr-only" htmlFor={`r-${m.id}`}>
          Write your own reply
        </label>
        <input id={`r-${m.id}`} name="body" className="field min-w-0 flex-1" maxLength={300} placeholder="Write your own reply" required />
        <button className="btn btn-sm">Send</button>
      </form>

      <form action={handledAction} className="mt-3">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="messageId" value={m.id} />
        <button className="font-semibold underline underline-offset-4">Mark handled without replying</button>
      </form>

      <p className="hint mt-4">{m.aiSource === "claude" ? "Read and sorted by Claude." : "Sorted by the built-in rules engine."}</p>
    </article>
  );
}
