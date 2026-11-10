import Link from "next/link";
import type { ReactNode } from "react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 font-semibold tracking-tight" aria-label="Reunite home">
      <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#12805e" />
            <stop offset="1" stopColor="#063d2d" />
          </linearGradient>
        </defs>
        <rect width="34" height="34" rx="10" fill="url(#lg)" />
        <path d="M9 9h6v6H9zM19 9h6v6h-6zM9 19h6v6H9z" fill="#fff" />
        <path d="M19 19h2.8v2.8H19zM22.2 22.2H25V25h-2.8z" fill="#62e3b1" />
      </svg>
      <span className={`text-[1.2rem] tracking-[-0.03em] ${light ? "text-white" : ""}`}>Reunite</span>
    </Link>
  );
}

export function Header({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-[#f2f4f1]/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Logo />
        <nav className="flex items-center gap-5 text-[0.95rem] font-medium">{right}</nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-muted">
        <p>Reunite. Get reached without sharing your number.</p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 font-medium">
          <Link href="/activate" className="hover:text-ink">
            Activate a tag
          </Link>
          <Link href="/#try" className="hover:text-ink">
            Try it
          </Link>
          <Link href="/signin" className="hover:text-ink">
            Sign in
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}

/** Narrow single-column page used by claim, scan, reply and inbox screens. */
export function Narrow({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <>
      <Header />
      <main className={`mx-auto w-full px-5 pb-20 pt-10 ${wide ? "max-w-3xl" : "max-w-xl"}`}>{children}</main>
      <Footer />
    </>
  );
}

export function Skeleton() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-black/[0.06]" />
      <div className="h-5 w-1/2 animate-pulse rounded-2xl bg-black/[0.06]" />
      <div className="h-40 animate-pulse rounded-2xl bg-black/[0.06]" />
    </div>
  );
}

/** Current time for request-time rendering (kept out of components for purity lint). */
export function requestTime(): number {
  return Date.now();
}

export function timeAgo(ms: number, now: number): string {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}
