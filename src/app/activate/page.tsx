import type { Metadata } from "next";
import { Narrow } from "@/components/chrome";
import { CodeLookup } from "@/components/code-lookup";

export const metadata: Metadata = { title: "Activate a tag" };

export default function ActivatePage() {
  return (
    <Narrow>
      <div className="grid gap-8">
        <div className="grid gap-3">
          <h1 className="text-4xl font-semibold sm:text-5xl">Activate your tag</h1>
          <p className="text-lg text-muted">
            Scan the QR code on your sticker with your phone camera, or enter the code from the card in your
            packaging.
          </p>
        </div>
        <CodeLookup />
      </div>
    </Narrow>
  );
}
