import Link from "next/link";
import { Footer, Header } from "@/components/chrome";
import { QrSvg } from "@/components/qr";
import { TryIt } from "@/components/try-it";
import { KINDS, TAG_KINDS } from "@/lib/kinds";
import { appUrl } from "@/lib/url";

const STEPS = [
  {
    title: "Put the sticker on",
    body: "Inside your windshield, on your bag, your laptop lid. It prints in reverse for glass so weather never touches it.",
  },
  {
    title: "A stranger scans it",
    body: "They open a page in their browser. No app, no account, and they never see your name, email or number.",
  },
  {
    title: "You answer in one tap",
    body: "You get how urgent it is, a translation if they wrote in another language, and replies ready to send.",
  },
];

const PRIVACY = [
  ["Your details stay hidden", "Finders see your tag name and a note. Never your email or number."],
  ["Location is opt-in", "A map pin is attached only if the finder taps share."],
  ["Abuse stops at the door", "Threats and spam are blocked before they reach your inbox."],
  ["Codes can't be guessed", "Random tag codes, hashed PINs and rate limits on every form."],
];

function HeroSticker() {
  return (
    <div className="w-44 rotate-[-5deg] rounded-[22px] bg-gradient-to-b from-[#12805e] to-[#063d2d] p-3 text-center text-white shadow-[0_30px_60px_-18px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.18)_inset] lg:w-40">
      <p className="text-[1.35rem] font-semibold leading-none tracking-[-0.04em] sm:text-2xl">Blocked in?</p>
      <p className="mt-1 text-[0.7rem] text-white/75">Scan to message the owner</p>
      <div className="relative mt-2.5 aspect-square overflow-hidden rounded-2xl bg-white p-1.5">
        <QrSvg value={`${appUrl()}/#try`} label="QR code on a sample TagBack sticker" className="h-full w-full" />
        <div className="sweep pointer-events-none absolute inset-x-0 top-0 h-1 bg-mint shadow-[0_0_14px_3px_var(--color-mint)]" />
      </div>
      <p className="mt-2 text-[0.65rem] text-white/70">No app. Your number stays private.</p>
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="relative mx-auto w-[17.5rem] rounded-[2.6rem] bg-[#0d1411] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_40px_80px_-30px_rgba(0,0,0,0.9)]">
      <div className="min-h-[27rem] rounded-[2.1rem] bg-[#f6f8f5] px-4 pb-5 pt-5 text-ink">
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-black/10" />
        <div className="flex items-center justify-between">
          <p className="text-[0.8rem] font-semibold text-muted">Blue Civic</p>
          <span className="pill pill-live text-[0.7rem]">New</span>
        </div>

        <div className="seq mt-3 rounded-2xl bg-white p-3 text-[0.9rem] shadow-[0_0_0_1px_rgba(13,20,17,0.06),0_8px_20px_-10px_rgba(13,50,35,0.25)]" style={{ "--d": "0.5s" } as React.CSSProperties}>
          Hola, su carro está bloqueando mi garaje. ¿Puede moverlo por favor?
        </div>

        <div className="seq mt-3 flex flex-wrap gap-1.5" style={{ "--d": "1.5s" } as React.CSSProperties}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf0d6] px-2.5 py-0.5 text-[0.75rem] font-semibold text-[#8a5a00]">
            <span className="size-1.5 rounded-full bg-current" /> Needs a reply
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcf7ea] px-2.5 py-0.5 text-[0.75rem] font-semibold text-sign">
            Translated from Spanish
          </span>
        </div>

        <div className="seq mt-3" style={{ "--d": "2s" } as React.CSSProperties}>
          <p className="text-[1.15rem] font-semibold leading-tight tracking-[-0.025em]">Your car is blocking their garage.</p>
        </div>

        <div className="seq mt-4 grid gap-2" style={{ "--d": "2.7s" } as React.CSSProperties}>
          <span className="rounded-full bg-sign px-3 py-2 text-center text-[0.85rem] font-semibold text-white">On my way, 5 minutes</span>
          <span className="rounded-full bg-white px-3 py-2 text-center text-[0.85rem] font-semibold shadow-[0_0_0_1px_rgba(13,20,17,0.12)]">Sorry, moving it now</span>
        </div>
      </div>
    </div>
  );
}

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: "TagBack", url: appUrl() },
    {
      "@type": "WebSite",
      name: "TagBack",
      url: appUrl(),
      description: "QR tags that let anyone reach you without your number.",
    },
    {
      "@type": "Product",
      name: "TagBack QR contact sticker",
      description: "A QR sticker for your car, luggage, laptop, keys or pet. Finders message you; your number stays private.",
      brand: { "@type": "Brand", name: "TagBack" },
      offers: { "@type": "Offer", priceCurrency: "USD", price: "9.99", availability: "https://schema.org/InStock" },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }} />
      <Header
        right={
          <>
            <Link href="/#try" className="hidden text-muted hover:text-ink sm:inline">
              Try it
            </Link>
            <Link href="/signin" className="text-muted hover:text-ink">
              Sign in
            </Link>
            <Link href="/activate" className="btn btn-sm">
              Activate a tag
            </Link>
          </>
        }
      />

      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-12 lg:grid-cols-[1fr_1fr] lg:pt-20">
          <div className="grid gap-7">
            <h1 className="text-[3.4rem] sm:text-[5.2rem]">
              Let strangers reach you. Not your number.
            </h1>
            <p className="max-w-[31rem] text-xl leading-snug text-muted">
              A QR tag for your car, bag, laptop, keys and pet. Someone scans it and sends a message. AI filters the
              abuse, flags what is urgent and translates, so you only see what matters.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/activate" className="btn">
                Activate a tag
              </Link>
              <Link href="/#try" className="btn btn-plain">
                Try the message filter
              </Link>
            </div>
          </div>

          <div className="stage grid gap-8 px-6 pb-10 pt-10 sm:px-10 lg:min-h-[34rem] lg:items-center" aria-label="What happens when someone scans a TagBack sticker">
            <div className="lg:ml-auto lg:mr-2">
              <PhoneMock />
            </div>
            <div className="mx-auto lg:absolute lg:bottom-8 lg:left-6 lg:mx-0">
              <HeroSticker />
            </div>
          </div>
        </section>

        <section id="try" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-10">
          <div className="stage p-6 sm:p-12">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-4xl sm:text-5xl">Every message is read before you see it</h2>
              <p className="mt-4 text-lg text-white/70">
                The first reader is an AI. It blocks threats and scams, sorts what is urgent, translates, and drafts
                replies. This runs live. Write a message as the finder.
              </p>
            </div>
            <TryIt />
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <h2 className="mb-10 max-w-xl text-4xl sm:text-5xl">From sticker to reply in three steps</h2>
          <ol className="card grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid content-start gap-3 p-7">
                <span className="grid size-9 place-items-center rounded-full bg-sign text-sm font-semibold text-white" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="text-2xl">{s.title}</h3>
                <p className="text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-20 md:grid-cols-[0.8fr_1.2fr]">
          <div className="grid content-start gap-4">
            <h2 className="text-4xl sm:text-5xl">One account, every tag</h2>
            <p className="max-w-sm text-lg text-muted">
              Add tags as you need them. Edit what finders see, preview it, and answer every inbox from one place.
            </p>
          </div>
          <ul className="card divide-y divide-line">
            {TAG_KINDS.map((k) => {
              const p = KINDS[k].print;
              const live = k === "car";
              return (
                <li key={k} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <p className="text-lg font-semibold tracking-tight">{KINDS[k].name}</p>
                    <p className="hint">
                      {p.wIn} by {p.hIn} inch sticker
                    </p>
                  </div>
                  <span className={`pill ${live ? "pill-live" : "pill-soon"}`}>{live ? "Available" : "Coming soon"}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-20">
          <h2 className="mb-10 max-w-xl text-4xl sm:text-5xl">Private by design</h2>
          <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {PRIVACY.map(([t, d]) => (
              <div key={t} className="border-t border-line pt-5">
                <dt className="text-xl font-semibold tracking-tight">{t}</dt>
                <dd className="mt-1 text-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-20">
          <div className="stage flex flex-wrap items-center justify-between gap-6 p-8 sm:p-12">
            <h2 className="max-w-xl text-4xl sm:text-5xl">Got a sticker? Activate it in a minute.</h2>
            <Link href="/activate" className="btn btn-light">
              Activate a tag
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
