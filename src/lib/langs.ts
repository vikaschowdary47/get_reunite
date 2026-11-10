export const LANGS = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "hi", name: "हिन्दी" },
  { code: "te", name: "తెలుగు" },
  { code: "zh", name: "中文" },
  { code: "pl", name: "Polski" },
] as const;

export const LANG_CODES = LANGS.map((l) => l.code) as [string, ...string[]];
