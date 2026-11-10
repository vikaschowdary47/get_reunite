/**
 * Load codes.csv into the database named by TURSO_DATABASE_URL (or the local dev database).
 *
 *   APP_SECRET=... TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run import -- out/first-run/codes.csv --kind car
 *
 * APP_SECRET must match the live site, because PINs are stored hashed with it.
 * The same import is available in a browser at /admin when ADMIN_TOKEN is set.
 */
import fs from "node:fs";
import { isKind } from "../src/lib/kinds";
import { importTags } from "../src/lib/tags";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* rely on the real environment */
}

async function main() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith("--"));
  const ki = argv.indexOf("--kind");
  const kind = ki >= 0 ? argv[ki + 1] : "car";
  if (!file) throw new Error("Usage: npm run import -- <codes.csv> [--kind car] [--batch name]");
  if (!isKind(kind)) throw new Error("Unknown --kind");
  const bi = argv.indexOf("--batch");
  const batch = bi >= 0 ? argv[bi + 1] : "import";
  const rows = fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.split(",").map((s) => s.trim()))
    .filter(([code, pin]) => code && code.toLowerCase() !== "code" && /^\d{6}$/.test(pin ?? ""))
    .map(([code, pin]) => ({ code, pin }));
  const { added, skipped } = await importTags(rows, kind, batch);
  console.log(`Added ${added} tags, skipped ${skipped} that already existed.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
