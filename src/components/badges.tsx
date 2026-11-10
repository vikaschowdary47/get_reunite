import { URGENCY_LABEL } from "@/lib/labels";
import type { Urgency } from "@/lib/tags";

const STYLE: Record<Urgency, string> = {
  urgent: "bg-[#fde8e9] text-[#a4262b]",
  normal: "bg-[#fdf0d6] text-[#8a5a00]",
  low: "bg-black/[0.06] text-muted",
};

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold ${STYLE[urgency]}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {URGENCY_LABEL[urgency]}
    </span>
  );
}
