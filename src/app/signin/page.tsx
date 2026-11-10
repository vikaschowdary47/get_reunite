import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SignInForm } from "@/components/account-forms";
import { Narrow, Skeleton } from "@/components/chrome";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function SignInPage() {
  return (
    <Narrow>
      <Suspense fallback={<Skeleton />}>
        <SignIn />
      </Suspense>
    </Narrow>
  );
}

async function SignIn() {
  await connection();
  if (await currentUser()) redirect("/dashboard");
  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <h1 className="text-4xl font-semibold sm:text-5xl">Sign in</h1>
        <p className="text-lg text-muted">
          See your tags, read messages, and edit what finders see. New here? Scan your sticker to activate your first
          tag.
        </p>
      </div>
      <SignInForm />
    </div>
  );
}
