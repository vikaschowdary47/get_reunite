"use client";

import { useActionState } from "react";
import { TAG_KINDS, KINDS } from "@/lib/kinds";
import { importCodesAction, type AdminState } from "./actions";

export function ImportForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(importCodesAction, {});
  return (
    <form action={action} className="grid gap-5">
      <div>
        <label className="label" htmlFor="token">Admin token</label>
        <input id="token" name="token" type="password" autoComplete="off" required className="field" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="kind">Tag type</label>
          <select id="kind" name="kind" className="field" defaultValue="car">
            {TAG_KINDS.map((k) => (
              <option key={k} value={k}>{KINDS[k].name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="batch">Batch name</label>
          <input id="batch" name="batch" defaultValue="first-run" className="field" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="csv">codes.csv contents</label>
        <textarea id="csv" name="csv" key={state.csv ?? ""} defaultValue={state.csv ?? ""} required rows={8} className="field mono" placeholder={"code,pin\n7K3F9QX2,123456"} />
        <p className="hint mt-2">Paste the whole file. The first line (code,pin) is ignored. A url column is not needed.</p>
      </div>
      {state.error && <p role="alert" className="error">{state.error}</p>}
      {state.ok && <p role="status" className="plaque bg-tow p-4 font-semibold">{state.ok}</p>}
      <button className="btn" disabled={pending}>{pending ? "Importing…" : "Import codes"}</button>
    </form>
  );
}
