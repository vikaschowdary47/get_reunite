/**
 * Everything that differs between TagBack products lives here: the words a
 * finder sees, the AI context, and the print specs. Keep it free of
 * server-only imports so client components can use it.
 */
export type TagKind = "car" | "luggage" | "laptop" | "keys" | "pet";

export const TAG_KINDS: TagKind[] = ["car", "luggage", "laptop", "keys", "pet"];

export type Surface = "inside-glass" | "outside";

export type KindConfig = {
  /** Product name for humans. */
  name: string;
  /** What the finder is looking at. */
  noun: string;
  labelPlaceholder: string;
  messagePlaceholder: string;
  /** Print artwork. */
  print: {
    wIn: number;
    hIn: number;
    radius: number; // points; a large value makes the tag a circle or pill
    surface: Surface;
    headline: string;
    sub: string;
    footer: string;
    plate: number; // QR plate size in points
    quiet: number; // QR quiet zone in modules
    headSize: number;
    subSize: number;
    showCode: boolean;
    theme: { bg: string; fg: string; accent: string; plate: string };
    material: string; // what to ask the printer for
  };
};

const GREEN = "#0a6b4b";
const INK = "#101820";
const YELLOW = "#ffc400";

export const KINDS: Record<TagKind, KindConfig> = {
  car: {
    name: "Car windshield sticker",
    noun: "vehicle",
    labelPlaceholder: "Blue Honda Civic",
    messagePlaceholder: "Your car is blocking mine in the lot on Oak Street.",
    print: {
      wIn: 3,
      hIn: 4,
      radius: 14,
      surface: "inside-glass",
      headline: "BLOCKED IN?",
      sub: "Scan to message the owner",
      footer: "No app needed. Your number stays private.",
      plate: 150,
      quiet: 4,
      headSize: 24,
      subSize: 11,
      showCode: true,
      theme: { bg: GREEN, fg: "#ffffff", accent: "#ffffff", plate: INK },
      material: "Front-facing (inside-glass) white vinyl, light/removable adhesive",
    },
  },
  luggage: {
    name: "Luggage and bag sticker",
    noun: "bag",
    labelPlaceholder: "Black Samsonite suitcase",
    messagePlaceholder: "I found your suitcase at the baggage claim. Where can I bring it?",
    print: {
      wIn: 2.5,
      hIn: 3.5,
      radius: 12,
      surface: "outside",
      headline: "FOUND MY BAG?",
      sub: "Scan to reach the owner",
      footer: "No app needed. Contact stays private.",
      plate: 118,
      quiet: 4,
      headSize: 16.5,
      subSize: 9.5,
      showCode: true,
      theme: { bg: INK, fg: "#ffffff", accent: YELLOW, plate: YELLOW },
      material: "Outdoor vinyl with laminate (permanent adhesive), or a PVC luggage tag",
    },
  },
  laptop: {
    name: "Laptop sticker",
    noun: "laptop",
    labelPlaceholder: "Maya's MacBook",
    messagePlaceholder: "I found a laptop with this sticker in the library. How do I get it back to you?",
    print: {
      wIn: 3,
      hIn: 3,
      radius: 22,
      surface: "outside",
      headline: "LOST? SCAN ME",
      sub: "I will find my way home",
      footer: "",
      plate: 108,
      quiet: 4,
      headSize: 21,
      subSize: 9.5,
      showCode: true,
      theme: { bg: INK, fg: "#ffffff", accent: YELLOW, plate: "#ffffff" },
      material: "Die-cut vinyl sticker, matte laminate, permanent adhesive",
    },
  },
  keys: {
    name: "Keychain tag",
    noun: "set of keys",
    labelPlaceholder: "House and car keys",
    messagePlaceholder: "I found your keys by the bus stop on Main Street.",
    print: {
      wIn: 1.5,
      hIn: 1.5,
      radius: 16,
      surface: "outside",
      headline: "",
      sub: "",
      footer: "SCAN IF FOUND",
      plate: 70,
      quiet: 3,
      headSize: 0,
      subSize: 0,
      showCode: false,
      theme: { bg: GREEN, fg: "#ffffff", accent: "#ffffff", plate: "#ffffff" },
      material: "Epoxy-domed or acrylic keychain tag (1.5in), or a small round vinyl sticker for an existing fob",
    },
  },
  pet: {
    name: "Pet collar tag",
    noun: "pet",
    labelPlaceholder: "Biscuit the beagle",
    messagePlaceholder: "I found a beagle near the park on Elm Street. He is safe with me.",
    print: {
      wIn: 1.5,
      hIn: 1.5,
      radius: 16,
      surface: "outside",
      headline: "",
      sub: "",
      footer: "FOUND ME? SCAN",
      plate: 70,
      quiet: 3,
      headSize: 0,
      subSize: 0,
      showCode: false,
      theme: { bg: YELLOW, fg: INK, accent: INK, plate: "#ffffff" },
      material: "Stainless or acrylic collar tag, laser-engraved or domed QR",
    },
  },
};

export function isKind(v: string): v is TagKind {
  return (TAG_KINDS as string[]).includes(v);
}
