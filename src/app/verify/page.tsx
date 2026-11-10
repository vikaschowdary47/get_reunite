import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { resendCodeAction } from "@/app/account-actions";
import { VerifyForm } from "@/components/account-forms";
import { Narrow, Skeleton } from "@/components/chrome";
import { getOtp } from "@/lib/auth";
import { getPending } from "@/lib/session";

export const metadata: Metadata = { title: "Enter your code", robots: { index: false, follow: false } };

export default function VerifyPage(props: PageProps<"/verify">) {
  return (
    <Narrow>
      <Suspense fallback={<Skeleton />}>
        <Verify searchParams={props.searchParams} />
      </Suspense>
    </Narrow>
  );
}

function mask(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

async function Verify({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  await connection();
  const id = await getPending();
  const otp = id ? await getOtp(id) : null;
  if (!otp) redirect("/signin");

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <h1 className="text-4xl font-semibold sm:text-5xl">Check your email</h1>
        <p className="text-lg text-muted">
          We sent a 6-digit code to <span className="font-bold text-ink">{mask(otp.email)}</span>
          {otp.payload ? `. Enter it to activate ${otp.payload.label}.` : "."} It expires in 10 minutes.
        </p>
        {sp.sent === "1" && <p className="font-bold text-sign">A new code is on its way.</p>}
        {sp.limit === "1" && <p className="error">Too many codes requested. Try again in an hour.</p>}
        {process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY && (
          <p className="hint">
            Local development: read the email at{" "}
            <Link href="/dev/outbox" className="underline">
              /dev/outbox
            </Link>
            .
          </p>
        )}
      </div>
      <VerifyForm />
      <div className="flex flex-wrap items-center gap-5">
        <form action={resendCodeAction}>
          <button className="font-semibold underline underline-offset-4">Send a new code</button>
        </form>
        <Link href="/signin" className="font-semibold underline underline-offset-4">
          Use a different email
        </Link>
      </div>
    </div>
  );
}
