import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountNav } from "@/components/account-nav";
import { DeleteTagForm, TagEditor } from "@/components/account-forms";
import { Narrow, Skeleton } from "@/components/chrome";
import { manageToken, normalizeCode } from "@/lib/ids";
import { KINDS } from "@/lib/kinds";
import { requireUser } from "@/lib/session";
import { getTagForUser } from "@/lib/tags";
import { appUrl } from "@/lib/url";

export const metadata: Metadata = { title: "Edit tag", robots: { index: false, follow: false } };

export default function EditTagPage(props: PageProps<"/dashboard/t/[code]">) {
  return (
    <Narrow wide>
      <Suspense fallback={<Skeleton />}>
        <Edit params={props.params} />
      </Suspense>
    </Narrow>
  );
}

async function Edit({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  await connection();
  const user = await requireUser();
  const tag = await getTagForUser(normalizeCode(raw), user.id);
  if (!tag) notFound();

  return (
    <div className="grid gap-8">
      <AccountNav active="tags" email={user.email} />
      <div className="grid gap-2">
        <Link href="/dashboard" className="hint underline underline-offset-4">
          All tags
        </Link>
        <h1 className="text-4xl font-semibold sm:text-5xl">{tag.label}</h1>
        <p className="text-muted">
          {KINDS[tag.kind].name} · <span className="font-mono font-bold text-ink">{tag.code}</span> · finders open{" "}
          <span className="font-mono text-ink">{appUrl().replace(/^https?:\/\//, "")}/t/{tag.code}</span>
        </p>
        <p>
          <Link href={`/m/${manageToken(tag.code, tag.epoch)}`} className="font-semibold underline underline-offset-4">
            Open inbox
          </Link>
        </p>
      </div>
      <TagEditor code={tag.code} kind={tag.kind} label={tag.label ?? ""} note={tag.note ?? ""} lang={tag.lang} />
      <DeleteTagForm code={tag.code} />
    </div>
  );
}
