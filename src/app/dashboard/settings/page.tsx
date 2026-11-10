import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountNav } from "@/components/account-nav";
import { DeleteAccountForm } from "@/components/account-forms";
import { Narrow, Skeleton } from "@/components/chrome";
import { ANNOUNCEMENTS } from "@/lib/announcements";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

export default function SettingsPage() {
  return (
    <Narrow wide>
      <Suspense fallback={<Skeleton />}>
        <Settings />
      </Suspense>
    </Narrow>
  );
}

async function Settings() {
  await connection();
  const user = await requireUser();
  return (
    <div className="grid gap-10">
      <AccountNav active="settings" email={user.email} />
      <h1 className="text-4xl font-semibold sm:text-5xl">Settings</h1>

      <section className="grid gap-2">
        <h2 className="text-2xl font-semibold">Account</h2>
        <p>
          Signed in as <span className="font-bold">{user.email}</span>. Alerts for all your tags go to this address.
        </p>
      </section>

      <section id="whats-new" aria-labelledby="new-h" className="grid gap-4 scroll-mt-6">
        <h2 id="new-h" className="text-2xl font-semibold">
          What&apos;s new
        </h2>
        <ul className="grid gap-4">
          {ANNOUNCEMENTS.map((a) => (
            <li key={a.title} className="card">
              <div className="grid gap-2 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`pill ${a.status === "Live" ? "pill-live" : "pill-soon"}`}
                  >
                    {a.status}
                  </span>
                  <span className="hint">{a.date}</span>
                </div>
                <h3 className="text-xl font-semibold">{a.title}</h3>
                <p>{a.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="del-h" className="grid gap-4 border-t border-alert/30 pt-6">
        <h2 id="del-h" className="text-2xl font-semibold">
          Delete account
        </h2>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
