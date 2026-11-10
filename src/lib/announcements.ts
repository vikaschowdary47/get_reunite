/**
 * The "What's new" panel in account settings. Our own ad space: edit this list
 * to announce products and features. Newest first. Keep status honest.
 */
export type Announcement = {
  date: string;
  title: string;
  body: string;
  status: "Live" | "Coming soon";
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    date: "2026-11",
    title: "Luggage, laptop and key tags",
    body: "The same private messaging on a luggage sticker, a laptop sticker with a design people want to keep, and a small keychain tag. Add them to this account with the code and PIN on their card.",
    status: "Coming soon",
  },
  {
    date: "2026-11",
    title: "AI that reads every message first",
    body: "Spam and abuse are filtered, urgent messages are flagged, other languages are translated, and you get one-tap replies.",
    status: "Live",
  },
  {
    date: "2026-11",
    title: "Pet collar tags",
    body: "A durable QR tag for your dog or cat, with the same private message inbox.",
    status: "Coming soon",
  },
];
