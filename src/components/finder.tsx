import { KINDS, type TagKind } from "@/lib/kinds";

/** What a finder sees at the top of a tag's page. Shared with the owner's preview. */
export function FinderCard({ kind, label, note }: { kind: TagKind; label: string; note?: string | null }) {
  return (
    <div className="plaque bg-sign text-white">
      <div className="grid gap-2 p-6">
        <p className="text-lg font-semibold">You scanned a Reunite for this {KINDS[kind].noun}</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">{label}</h1>
        {note && <p className="text-lg">{note}</p>}
      </div>
    </div>
  );
}

export function InactiveCard() {
  return (
    <div className="plaque bg-white">
      <div className="grid gap-2 p-6">
        <h1 className="text-3xl font-semibold">This tag is no longer active</h1>
        <p className="text-lg text-muted">The owner has removed it, so messages cannot be delivered.</p>
      </div>
    </div>
  );
}
