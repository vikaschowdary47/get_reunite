import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

// No 0/O/1/I/L so codes survive being read aloud or typed from a card.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Random, unguessable tag code, e.g. "7K3F9QX2". Never sequential. */
export function newCode(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return out;
}

/** Six-digit activation PIN printed on the packaging card. */
export function newPin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** URL-safe secret used for owner manage links and finder reply links. */
export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Six-digit one-time sign-in code. */
export function newOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function newId(): string {
  return randomBytes(9).toString("base64url");
}

const PEPPER = () => {
  const s = process.env.APP_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("APP_SECRET is not set. Generate one with: openssl rand -hex 32");
  return "dev-only-secret-change-me";
};

/** Secrets are stored hashed, so a database leak does not expose live links. */
export function hash(value: string): string {
  return createHash("sha256").update(`${PEPPER()}:${value}`).digest("hex");
}

/**
 * Owner inbox link token: "<code>.<signature>". The signature is an HMAC of the
 * code and the tag's epoch, so links can be regenerated for alert emails without
 * storing the secret. Bumping the epoch revokes every previously issued link.
 */
export function manageToken(code: string, epoch = 0): string {
  const sig = createHmac("sha256", PEPPER()).update(`manage:${code}:${epoch}`).digest("base64url").slice(0, 27);
  return `${code}.${sig}`;
}

/** Split a manage token into its code; the caller verifies it against the tag's epoch. */
export function manageTokenCode(token: string): string | null {
  const [code, sig] = token.split(".");
  return code && sig ? code : null;
}

export function manageTokenValid(token: string, code: string, epoch: number): boolean {
  const expected = Buffer.from(manageToken(code, epoch));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
