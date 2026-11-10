"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CodeLookup() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const code = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 6) {
      setError("Codes have 8 letters and numbers. Check the card in your packaging.");
      return;
    }
    router.push(`/t/${code}`);
  }

  return (
    <form onSubmit={go} className="grid gap-4">
      <div>
        <label className="label" htmlFor="code">
          Tag code
        </label>
        <input
          id="code"
          className="field font-mono text-xl uppercase tracking-[0.25em]"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          maxLength={12}
          placeholder="7K3F9QX2"
          autoComplete="off"
          autoCapitalize="characters"
          required
        />
        <p className="hint mt-1">
          Scanning the sticker is faster, but you can type the code from the card in your packaging.
        </p>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div>
        <button className="btn">Continue</button>
      </div>
    </form>
  );
}
