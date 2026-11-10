"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { startClaimAction } from "@/app/account-actions";
import { sendMessageAction, type FormState } from "@/app/actions";
import { KINDS, type TagKind } from "@/lib/kinds";
import { LANGS } from "@/lib/langs";

const initial: FormState = {};

export function Err({ state }: { state: FormState }) {
  return state.error ? (
    <p role="alert" className="error">
      {state.error}
    </p>
  ) : null;
}

export function LangSelect({ defaultValue = "en" }: { defaultValue?: string }) {
  return (
    <div>
      <label className="label" htmlFor="lang">
        Language for messages you receive
      </label>
      <select id="lang" name="lang" defaultValue={defaultValue} className="field">
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
      <p className="hint mt-1">Finders can write in any language. You read and reply in yours.</p>
    </div>
  );
}

export function ClaimForm({ code, kind = "car" }: { code: string; kind?: TagKind }) {
  const [state, action, pending] = useActionState(startClaimAction, initial);
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="code" value={code} />
      <div>
        <label className="label" htmlFor="pin">
          Activation PIN
        </label>
        <input
          id="pin"
          name="pin"
          className="field font-mono text-xl tracking-[0.3em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="000000"
          required
        />
        <p className="hint mt-1">Six digits, printed on the card that came with your sticker.</p>
      </div>
      <div>
        <label className="label" htmlFor="label">
          Name this tag
        </label>
        <input id="label" name="label" className="field" maxLength={40} placeholder={KINDS[kind].labelPlaceholder} required />
      </div>
      <div>
        <label className="label" htmlFor="email">
          Your email
        </label>
        <input id="email" name="email" type="email" className="field" autoComplete="email" placeholder="you@example.com" required />
        <p className="hint mt-1">We email you a code to finish. Alerts go here. Finders never see it.</p>
      </div>
      <div>
        <label className="label" htmlFor="note">
          Note shown to finders (optional)
        </label>
        <textarea
          id="note"
          name="note"
          className="field"
          maxLength={200}
          placeholder="I'm usually back within 10 minutes. Message me and I'll move it."
        />
      </div>
      <LangSelect />
      <Err state={state} />
      <button className="btn" disabled={pending}>
        {pending ? "Sending code…" : "Send my code"}
      </button>
      <p className="hint">
        By continuing you agree to the <Link href="/terms" className="underline underline-offset-4">Terms</Link> and{" "}
        <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.
      </p>
    </form>
  );
}

export function MessageForm({ code, kind = "car" }: { code: string; kind?: TagKind }) {
  const [state, action, pending] = useActionState(sendMessageAction, initial);
  const [geo, setGeo] = useState<{ lat: string; lng: string } | null>(null);
  const [geoMsg, setGeoMsg] = useState("");

  function share() {
    if (!navigator.geolocation) {
      setGeoMsg("This browser cannot share location. Type where you are instead.");
      return;
    }
    setGeoMsg("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeo({ lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) });
        setGeoMsg("");
      },
      () => setGeoMsg("Location was not shared. You can type where you are instead."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="lat" value={geo?.lat ?? ""} />
      <input type="hidden" name="lng" value={geo?.lng ?? ""} />
      {/* honeypot: hidden from people, tempting to bots */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label className="label" htmlFor="body">
          What do you need them to know?
        </label>
        <textarea
          id="body"
          name="body"
          className="field"
          maxLength={500}
          required
          placeholder={KINDS[kind].messagePlaceholder}
        />
        <p className="hint mt-1">Any language works. Include what the owner needs, like where you are and how to reach you. You can send another message anytime by scanning the code again.</p>
      </div>
      <div>
        <label className="label" htmlFor="where">
          Where are you? (optional)
        </label>
        <input id="where" name="where" className="field" maxLength={120} placeholder="Corner of Oak and 5th" />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-plain btn-sm" onClick={share} disabled={!!geo}>
            {geo ? "Location attached" : "Share my location"}
          </button>
          <span className="hint" aria-live="polite">
            {geo ? "The owner will see a map pin." : geoMsg || "Only sent if you tap the button."}
          </span>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="contact">
          Phone or email so they can reach you (optional)
        </label>
        <input id="contact" name="contact" className="field" maxLength={80} autoComplete="off" />
        <p className="hint mt-1">Only the tag owner sees this.</p>
      </div>
      <Err state={state} />
      <button className="btn" disabled={pending}>
        {pending ? "Sending…" : "Send to owner"}
      </button>
      <p className="hint">
        Your message is screened by AI and shown to the owner. Some filtering mistakes are possible. See the{" "}
        <Link href="/terms" className="underline underline-offset-4">Terms</Link> and{" "}
        <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.
      </p>
      <p className="hint">
        Messages are checked for abuse before delivery. No account or app needed.
      </p>
    </form>
  );
}
