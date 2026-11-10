"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  addTagAction,
  deleteAccountAction,
  deleteTagAction,
  signInAction,
  updateTagAction,
  verifyAction,
} from "@/app/account-actions";
import type { FormState } from "@/app/actions";
import { FinderCard } from "@/components/finder";
import { Err, LangSelect, MessageForm } from "@/components/forms";
import type { TagKind } from "@/lib/kinds";

const initial: FormState = {};

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, initial);
  return (
    <form action={action} className="grid gap-5">
      <div>
        <label className="label" htmlFor="email">
          Your email
        </label>
        <input id="email" name="email" type="email" className="field" autoComplete="email" placeholder="you@example.com" required />
        <p className="hint mt-1">We email you a 6-digit code. No password.</p>
      </div>
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

export function VerifyForm() {
  const [state, action, pending] = useActionState(verifyAction, initial);
  return (
    <form action={action} className="grid gap-5">
      <div>
        <label className="label" htmlFor="code">
          6-digit code
        </label>
        <input
          id="code"
          name="code"
          className="field font-mono text-2xl tracking-[0.4em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="000000"
          required
          autoFocus
        />
      </div>
      <Err state={state} />
      <button className="btn" disabled={pending}>
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}

export function AddTagForm() {
  const [state, action, pending] = useActionState(addTagAction, initial);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="add-code">
            Tag code
          </label>
          <input
            id="add-code"
            name="code"
            className="field font-mono uppercase tracking-[0.2em]"
            maxLength={12}
            placeholder="7K3F9QX2"
            autoCapitalize="characters"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="add-pin">
            Activation PIN
          </label>
          <input
            id="add-pin"
            name="pin"
            className="field font-mono tracking-[0.3em]"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="000000"
            required
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="add-label">
          Name this tag
        </label>
        <input id="add-label" name="label" className="field" maxLength={40} placeholder="Silver laptop" required />
      </div>
      <Err state={state} />
      <div>
        <button className="btn btn-plain" disabled={pending}>
          {pending ? "Adding…" : "Add tag"}
        </button>
      </div>
    </form>
  );
}

export function TagEditor({
  code,
  kind,
  label: initialLabel,
  note: initialNote,
  lang,
}: {
  code: string;
  kind: TagKind;
  label: string;
  note: string;
  lang: string;
}) {
  const [state, action, pending] = useActionState(updateTagAction, initial);
  const [label, setLabel] = useState(initialLabel);
  const [note, setNote] = useState(initialNote);
  const [preview, setPreview] = useState(false);

  return (
    <div className="grid gap-8">
      <form action={action} className="grid gap-5">
        <input type="hidden" name="code" value={code} />
        <div>
          <label className="label" htmlFor="e-label">
            Tag name <span className="hint">(finders see this)</span>
          </label>
          <input
            id="e-label"
            name="label"
            className="field"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={40}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="e-note">
            Note <span className="hint">(finders see this)</span>
          </label>
          <textarea
            id="e-note"
            name="note"
            className="field"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="I'm usually back within 10 minutes. Message me and I'll move it."
          />
        </div>
        <LangSelect defaultValue={lang} />
        <Err state={state} />
        {state.ok && !pending && (
          <p role="status" className="font-bold text-sign">
            Saved. Finders see the new details now.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button className="btn" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
          <button type="button" className="btn btn-plain" aria-expanded={preview} onClick={() => setPreview((p) => !p)}>
            {preview ? "Hide preview" : "Preview"}
          </button>
        </div>
      </form>

      {preview && (
        <section aria-label="Finder preview" className="grid gap-4">
          <p className="hint">
            Preview: this is what a finder sees when they scan this tag, using what you typed above. Nothing sent from
            here.
          </p>
          <div className="grid gap-8 rounded-3xl bg-black/[0.04] p-3 sm:p-6">
            <FinderCard kind={kind} label={label.trim() || "Your tag name"} note={note.trim() || null} />
            <fieldset disabled className="m-0 min-w-0 border-0 p-0">
              <MessageForm code={code} kind={kind} />
            </fieldset>
          </div>
        </section>
      )}
    </div>
  );
}

export function DeleteTagForm({ code }: { code: string }) {
  return (
    <details className="border-t border-line pt-5">
      <summary className="cursor-pointer text-xl font-semibold">Delete this tag</summary>
      <form action={deleteTagAction} className="mt-4 grid gap-4">
        <input type="hidden" name="code" value={code} />
        <p>
          The sticker stops working: anyone who scans it sees that the tag is no longer active, and its messages become
          unreachable. A deleted code is never reused.
        </p>
        <div>
          <button className="btn btn-danger">Yes, delete this tag</button>
        </div>
      </form>
    </details>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccountAction, initial);
  return (
    <form action={action} className="grid gap-4">
      <p>
        This signs you out, deactivates every tag on your account, and permanently erases their messages. It cannot be
        undone.
      </p>
      <div>
        <label className="label" htmlFor="confirm">
          Type DELETE to confirm
        </label>
        <input id="confirm" name="confirm" className="field font-mono uppercase" autoComplete="off" required />
      </div>
      <Err state={state} />
      <div>
        <button className="btn btn-danger" disabled={pending}>
          {pending ? "Deleting…" : "Delete my account"}
        </button>
      </div>
    </form>
  );
}
