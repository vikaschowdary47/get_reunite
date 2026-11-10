import Link from "next/link";
import { signOutAction } from "@/app/account-actions";

export function AccountNav({ active, email }: { active: "tags" | "settings"; email: string }) {
  const link = (on: boolean) =>
    `rounded-full px-4 py-1.5 text-[0.95rem] font-semibold transition-colors ${on ? "bg-white text-ink shadow-[0_1px_2px_rgba(13,30,22,0.12),0_0_0_1px_rgba(13,20,17,0.06)]" : "text-muted hover:text-ink"}`;
  return (
    <nav aria-label="Account" className="flex flex-wrap items-center gap-x-2 gap-y-2">
      <div className="flex rounded-full bg-black/[0.05] p-1">
      <Link href="/dashboard" className={link(active === "tags")}>
        Your tags
      </Link>
      <Link href="/dashboard/settings" className={link(active === "settings")}>
        Settings
      </Link>
      </div>
      <span className="hint ml-auto hidden sm:inline">{email}</span>
      <form action={signOutAction}>
        <button className="rounded-full px-3 py-1.5 text-[0.95rem] font-semibold text-muted hover:text-ink">Sign out</button>
      </form>
    </nav>
  );
}
