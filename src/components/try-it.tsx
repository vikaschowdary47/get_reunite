"use client";

import { useState, useTransition } from "react";
import { tryItAction, type DemoResult } from "@/app/demo-actions";
import { UrgencyBadge } from "@/components/badges";
import { CATEGORY_LABEL } from "@/lib/labels";
import type { Category } from "@/lib/tags";

const EXAMPLES = [
  { label: "Blocked in (Spanish)", text: "Hola, su carro está bloqueando mi garaje. ¿Puede moverlo por favor?" },
  { label: "Tow truck", text: "A tow truck is hooking up your car right now, come out fast!" },
  { label: "Lights on", text: "Your headlights are still on and the back door is open." },
  { label: "Threat", text: "Move your car or I will smash your windows." },
];

export function TryIt() {
  const [body, setBody] = useState(EXAMPLES[0].text);
  const [res, setRes] = useState<DemoResult | null>(null);
  const [pending, start] = useTransition();

  function run() {
    start(async () => setRes(await tryItAction({ body, ownerLang: "en" })));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="grid content-start gap-4">
        <div>
          <label className="label text-white/85" htmlFor="try-body">
            You are the finder. Type what you would send.
          </label>
          <textarea
            id="try-body"
            className="field"
            value={body}
            maxLength={300}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Example messages">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white ring-1 ring-white/15 transition-colors hover:bg-white/20"
              onClick={() => {
                setBody(ex.text);
                setRes(null);
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>
        <div>
          <button className="btn btn-light" onClick={run} disabled={pending}>
            {pending ? "Checking…" : "See what the owner gets"}
          </button>
        </div>
      </div>

      <div aria-live="polite" className="min-h-72">
        <Result res={res} pending={pending} />
      </div>
    </div>
  );
}

function Result({ res, pending }: { res: DemoResult | null; pending: boolean }) {
  if (pending) return <p className="text-white/70">Reading the message…</p>;
  if (!res) {
    return (
      <div className="rounded-3xl bg-white/[0.06] ring-1 ring-white/10">
        <p className="p-6 text-white/65">
          The owner&apos;s alert appears here: how urgent it is, what it is about, a translation, and replies
          ready to send.
        </p>
      </div>
    );
  }
  if (!res.ok) return <p className="error">{res.error}</p>;

  if (!res.safe) {
    return (
      <div className="rounded-3xl bg-[#c93338] text-white">
        <div className="grid gap-2 p-6">
          <h3 className="text-2xl font-semibold tracking-tight">Stopped before it reached the owner</h3>
          <p>
            Reason: <strong>{res.blockReason}</strong>. The finder is asked to rephrase. The owner is never shown
            this message.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]">
      <div className="grid gap-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <UrgencyBadge urgency={res.urgency} />
          <span className="font-semibold">{CATEGORY_LABEL[res.category as Category] ?? "Message"}</span>
        </div>
        <p className="text-2xl font-semibold leading-tight tracking-tight">{res.summary}</p>
        {res.translation && (
          <div>
            <p className="hint">Translated from {res.language.toUpperCase()}</p>
            <p>{res.translation}</p>
          </div>
        )}
        <div>
          <p className="hint mb-2">One-tap replies</p>
          <div className="flex flex-wrap gap-2">
            {res.quickReplies.map((q) => (
              <span key={q} className="rounded-full bg-black/[0.05] px-3.5 py-1.5 text-[0.95rem] font-medium">
                {q}
              </span>
            ))}
          </div>
        </div>
        <p className="hint border-t border-line pt-3">
          {res.source === "claude"
            ? "Analyzed by Claude."
            : "Analyzed by the built-in rules engine."}
        </p>
      </div>
    </div>
  );
}
