import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountNav } from "@/components/account-nav";
import { AddTagForm } from "@/components/account-forms";
import { Narrow, Skeleton } from "@/components/chrome";
import { ANNOUNCEMENTS } from "@/lib/announcements";
import { manageToken } from "@/lib/ids";
import { KINDS } from "@/lib/kinds";
import { requireUser } from "@/lib/session";
import { listTagsForUser } from "@/lib/tags";

export const metadata: Metadata = { title: "Your tags", robots: { index: false, follow: false } };

export default function DashboardPage(props: PageProps<"/dashboard">) {
  return (
    <Narrow wide>
      <Suspense fallback={<Skeleton />}>
        <Dashboard searchParams={props.searchParams} />
      </Suspense>
    </Narrow>
  );
}

async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  await connection();
  const user = await requireUser();
  const tags = await listTagsForUser(user.id);
  const activated = typeof sp.activated === "string" ? sp.activated : null;
  const news = ANNOUNCEMENTS[0];

  return (
    <div className="grid gap-8">
      <AccountNav active="tags" email={user.email} />

      {activated && tags.some((t) => t.code === activated) && (
        <div className="plaque bg-tow text-ink">
          <div className="grid gap-1 p-5">
            <h2 className="text-2xl font-semibold">Your tag is active</h2>
            <p>
              Stick it on and you are set. Messages arrive here and by email at {user.email}.
            </p>
          </div>
        </div>
      )}

      <h1 className="text-4xl font-semibold sm:text-5xl">Your tags</h1>

      {tags.length === 0 ? (
        <p className="text-lg text-muted">No tags yet. Add one below with the code and PIN from its card.</p>
      ) : (
        <ul className="grid gap-4">
          {tags.map((t) => (
            <li key={t.code} className="card grid gap-3 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold">{t.label}</h2>
                {t.unread > 0 && (
                  <span className="pill pill-live">
                    {t.unread} new
                  </span>
                )}
              </div>
              <p className="hint">
                {KINDS[t.kind].name}, code <span className="mono">{t.code}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/m/${manageToken(t.code, t.epoch)}`} className="btn btn-sm">
                  Open inbox
                </Link>
                <Link href={`/dashboard/t/${t.code}`} className="btn btn-plain btn-sm">
                  Edit and preview
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="add-h" className="grid gap-4 border-t border-line pt-6">
        <h2 id="add-h" className="text-2xl font-semibold">
          Add another tag
        </h2>
        <AddTagForm />
      </section>

      <Link href="/dashboard/settings#whats-new" className="card block p-1 no-underline transition-transform hover:-translate-y-0.5">
        <span className="grid gap-2 p-5">
          <span className="pill pill-soon w-fit">What&apos;s new: {news.status}</span>
          <span className="text-xl font-semibold">{news.title}</span>
        </span>
      </Link>
    </div>
  );
}
