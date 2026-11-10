# TagBack

QR contact tags for cars, luggage, laptops, keys and pets. Someone scans the sticker, types a message, and the owner gets an alert by email. Nobody's phone number is exposed, and neither side needs an app.

## How it works

1. A batch script makes N tags, each with a random 8-character code and a 6-digit PIN, and prints QR artwork plus activation cards.
2. The buyer scans the sticker, enters the PIN from the card and an email address, types the 6-digit code emailed to them, and is signed in. No passwords.
3. Signed-in owners see every tag on one dashboard: add a tag, edit what finders see (with a live preview), delete a tag, read and reply to messages, and see What's new in Settings.
4. A finder scans the sticker and sends a message. Claude screens it for abuse, detects the language and urgency, translates it, and drafts one-tap replies.
5. Alert emails carry a one-tap private inbox link, so owners can reply without signing in.

## AI

`src/lib/ai.ts` calls Claude with the finder message passed as delimited untrusted data, validates the JSON output with zod, and times out after 8 seconds. On any failure it falls back to a deterministic rules engine, so alerts are never lost. Blocked messages are stored but never delivered.

## Security notes

- Codes are random and unguessable. The QR only contains `APP_URL/t/CODE`, never owner details.
- PINs are stored hashed. Owner inbox links are HMAC-signed with a revocation epoch. Finder reply links are stored hashed.
- Rate limits are DB-backed per hashed IP and per tag. The finder form has a honeypot field. Location is opt-in.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
npm test               # unit tests
```

## Print a sticker batch

```bash
# 1. Set APP_URL to the real address first. It is baked into every QR code.
# 2. Make the codes and artwork without touching any database:
APP_URL=https://yoursite.example npm run batch -- --count 30 --kind car --batch first-run --offline
```

Writes `out/first-run/` with `qr-labels.pdf` (plain 1.6 in QR labels for a home printer), `stickers.pdf` (full sticker artwork), `cards.pdf` (activation cards with the PIN) and `codes.csv` (contains PINs, keep private). Use `--mirror` for inside-the-glass stickers so the artwork reads correctly from outside. Without `--offline` the script writes the codes to whichever database your env points at.

Then register the codes with the live site, using either:

- the browser: open `/admin`, enter `ADMIN_TOKEN`, paste `codes.csv`, and press Import; or
- the terminal: `APP_SECRET=... TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run import -- out/first-run/codes.csv --kind car`

Import is safe to repeat: codes that already exist are skipped. `APP_SECRET` must be the same value the live site uses, because PINs are stored hashed with it.

## Deploy on Netlify

Netlify cannot run this app from a dragged-in zip or folder (that only works for static sites). Deploy from a Git repository or with the Netlify CLI.

1. Create a free Turso database (`turso db create tagback`, then `turso db tokens create tagback`). Serverless hosting has no writable disk, so the app refuses to start on Netlify without `TURSO_DATABASE_URL`.
2. Create a Resend account, verify your sending domain, and create an API key. Without it, sign-in emails cannot be sent in production.
3. Push the project to GitHub, then in Netlify choose Add new site > Import an existing project. `netlify.toml` already sets the build command and Node 22.
4. Under Site configuration > Environment variables, set everything in `.env.example`: `APP_URL` (the final address, with no trailing slash), `APP_SECRET`, `ADMIN_TOKEN`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM`, and `ANTHROPIC_API_KEY`. Set `APP_URL` before the first build, and redeploy after changing any variable.
5. Open the site, sign in with your own email to confirm the code arrives, then make and import your sticker codes.

Printed QR codes contain the site address permanently. Use a custom domain you own, not a `*.netlify.app` address you may want to change.

## Roadmap

- Payment gate on tag activation: add behind a single config constant, off by default.
- Pet and bag artwork, SMS alerts, owner-side language auto-detect.
