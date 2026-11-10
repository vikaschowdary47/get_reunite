import type { ReactNode } from "react";
import { Footer, Header } from "@/components/chrome";
import { LEGAL_UPDATED } from "@/lib/site";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-12">
        <h1 className="text-5xl sm:text-6xl">{title}</h1>
        <p className="hint mt-3">Last updated {LEGAL_UPDATED}</p>
        <p className="mt-6 text-xl leading-snug text-muted">{intro}</p>
        <div className="mt-10 grid gap-10">{children}</div>
      </main>
      <Footer />
    </>
  );
}

export function Sec({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="text-2xl">{title}</h2>
      <div className="mt-3 grid gap-3 text-[1.02rem] leading-relaxed [&_li]:ml-5 [&_li]:list-disc [&_ul]:grid [&_ul]:gap-1.5">
        {children}
      </div>
    </section>
  );
}
