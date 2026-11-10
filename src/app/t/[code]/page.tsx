import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Narrow, Skeleton } from "@/components/chrome";
import { FinderCard, InactiveCard } from "@/components/finder";
import { ClaimForm, MessageForm } from "@/components/forms";
import { normalizeCode } from "@/lib/ids";
import { getTag } from "@/lib/tags";

export const metadata: Metadata = {
  title: "Message the owner",
  robots: { index: false, follow: false },
};

export default function TagPage(props: PageProps<"/t/[code]">) {
  return (
    <Narrow>
      <Suspense fallback={<Skeleton />}>
        <TagView params={props.params} />
      </Suspense>
    </Narrow>
  );
}

async function TagView({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  await connection();
  const code = normalizeCode(raw);
  const tag = await getTag(code);
  if (!tag) notFound();

  if (tag.status === "disabled") return <InactiveCard />;

  if (tag.status === "unclaimed") {
    return (
      <div className="grid gap-8">
        <div className="grid gap-3">
          <h1 className="text-4xl font-semibold sm:text-5xl">Activate this tag</h1>
          <p className="text-lg text-muted">
            Tag <span className="font-mono font-bold text-ink">{tag.code}</span> is ready to set up. It takes about
            a minute, and you only do it once.
          </p>
        </div>
        <ClaimForm code={tag.code} kind={tag.kind} />
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <FinderCard kind={tag.kind} label={tag.label ?? ""} note={tag.note} />
      <MessageForm code={tag.code} kind={tag.kind} />
    </div>
  );
}
