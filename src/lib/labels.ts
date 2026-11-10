import type { Category, Urgency } from "./tags";

// Kept free of server-only imports so client components can use it.
export const CATEGORY_LABEL: Record<Category, string> = {
  blocked_in: "Blocked in",
  lights_on: "Lights or door left open",
  damage: "Possible damage",
  towing_risk: "Tow or ticket risk",
  found_item: "Someone found your item",
  arrange_return: "Arranging a return",
  other: "Message",
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  urgent: "Urgent",
  normal: "Time-sensitive",
  low: "Low priority",
};
