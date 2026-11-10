/**
 * Generate a batch of unique TagBack stickers.
 *
 *   npm run batch -- --count 50 --kind car --batch first-run --mirror
 *   --kind: car | luggage | laptop | keys | pet
 *
 * Creates the tags in the database (unclaimed), then writes to out/<batch>/:
 *   stickers.pdf  vector artwork, 2x2 per US Letter page, magenta cut line
 *   cards.pdf     activation cards (tag code + PIN) to put in each package
 *   codes.csv     code, PIN, URL. Treat as secret: PINs are shown only here.
 *
 * --offline makes codes without touching any database. Load codes.csv into the live site
 *   afterwards at /admin (needs ADMIN_TOKEN) or with `npm run import -- <csv> --kind car`.
 *   Also writes qr-labels.pdf: plain 1.5 in QR labels for printing on sticker paper.
 *
 * --mirror prints the artwork reversed for second-surface (inside the glass)
 * stickers, so it reads correctly from outside.
 */
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { isKind, KINDS, TAG_KINDS, type TagKind } from "../src/lib/kinds";
import { createTags, generateCodes } from "../src/lib/tags";
import { appUrl } from "../src/lib/url";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* no .env.local: rely on the real environment */
}

type Args = { count: number; kind: TagKind; batch: string; mirror: boolean; offline: boolean; out: string };

function parseArgs(argv: string[]): Args {
  const get = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const count = Number(get("count") ?? 20);
  const kind = get("kind") ?? "car";
  if (!Number.isInteger(count) || count < 1 || count > 2000) throw new Error("--count must be 1-2000");
  if (!isKind(kind)) throw new Error(`--kind must be one of: ${TAG_KINDS.join(", ")}`);
  const batch = (get("batch") ?? new Date().toISOString().slice(0, 10)).replace(/[^\w-]/g, "-");
  return { count, kind, batch, mirror: argv.includes("--mirror"), offline: argv.includes("--offline"), out: get("out") ?? "out" };
}

const IN = 72; // PDF points per inch
const INK = "#101820";
const GREEN = "#0a6b4b";
const CUT = "#ff00ff";

function drawSticker(doc: PDFKit.PDFDocument, ox: number, oy: number, code: string, kind: TagKind, url: string, mirror: boolean) {
  const p = KINDS[kind].print;
  const w = p.wIn * IN;
  const h = p.hIn * IN;
  const t = p.theme;
  doc.save();
  if (mirror) {
    doc.translate(ox + w, oy);
    doc.scale(-1, 1);
  } else {
    doc.translate(ox, oy);
  }

  const r = Math.min(p.radius, w / 2, h / 2);
  doc.roundedRect(0, 0, w, h, r).fill(t.bg);
  const inset = Math.min(7, w * 0.05);
  doc.roundedRect(inset, inset, w - inset * 2, h - inset * 2, Math.max(r - inset, 2)).lineWidth(1.6).stroke(t.accent);

  let y = h * 0.075;
  if (p.headline) {
    doc.fillColor(t.fg).font("Helvetica-Bold").fontSize(p.headSize).text(p.headline, 10, y + 4, { width: w - 20, align: "center", lineBreak: false });
    y += p.headSize + 12;
    doc.fillColor(t.fg).font("Helvetica-Bold").fontSize(p.subSize).text(p.sub, 10, y, { width: w - 20, align: "center", lineBreak: false });
    y += p.subSize + 12;
  } else {
    y = (h - p.plate) / 2 - (p.footer ? 6 : 0);
  }

  // QR on a plate with a proper quiet zone
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const m = p.plate / (n + p.quiet * 2);
  const px = (w - p.plate) / 2;
  doc.roundedRect(px - 3, y - 3, p.plate + 6, p.plate + 6, 7).fill(t.plate);
  doc.rect(px, y, p.plate, p.plate).fill("#ffffff");
  doc.fillColor(INK);
  for (let yy = 0; yy < n; yy++) {
    for (let xx = 0; xx < n; xx++) {
      if (qr.modules.data[yy * n + xx]) doc.rect(px + (xx + p.quiet) * m, y + (yy + p.quiet) * m, m + 0.02, m + 0.02).fill();
    }
  }
  y += p.plate;

  const small = w < 3 * IN;
  if (p.footer) {
    doc.fillColor(t.fg).font("Helvetica-Bold").fontSize(small ? 6.5 : 8.5).text(p.footer, 8, y + (small ? 9 : 16), { width: w - 16, align: "center", lineBreak: false });
  }
  if (p.showCode) {
    doc.font("Courier-Bold").fontSize(8.5).fillColor(t.fg).text(`tagback  ${code}`, 8, h - Math.max(inset + 15, 22), { width: w - 16, align: "center", lineBreak: false });
  }

  // cut contour (spot-colour style hairline), same shape as the sticker
  doc.roundedRect(0, 0, w, h, r).lineWidth(0.5).stroke(CUT);
  doc.restore();
}

function stickersPdf(file: string, tags: { code: string }[], a: Args, base: string) {
  const p = KINDS[a.kind].print;
  const mirror = a.mirror && p.surface === "inside-glass";
  const doc = new PDFDocument({ size: "LETTER", margin: 0, info: { Title: `TagBack ${a.kind} ${a.batch}` } });
  doc.pipe(fs.createWriteStream(file));
  const w = p.wIn * IN;
  const h = p.hIn * IN;
  const gap = 0.2 * IN;
  const cols = Math.max(1, Math.floor((8.5 * IN - 0.5 * IN + gap) / (w + gap)));
  const rows = Math.max(1, Math.floor((11 * IN - 0.5 * IN + gap) / (h + gap)));
  const perPage = cols * rows;
  const startX = (8.5 * IN - (cols * w + (cols - 1) * gap)) / 2;
  const startY = (11 * IN - (rows * h + (rows - 1) * gap)) / 2;
  tags.forEach((t, i) => {
    const slot = i % perPage;
    if (i > 0 && slot === 0) doc.addPage();
    const x = startX + (slot % cols) * (w + gap);
    const y = startY + Math.floor(slot / cols) * (h + gap);
    drawSticker(doc, x, y, t.code, a.kind, `${base}/t/${t.code}`, mirror);
  });
  doc.end();
}

/** Plain QR labels: a 1.6 in white square (QR plus quiet zone) with the code underneath. */
function qrLabelsPdf(file: string, tags: { code: string }[], base: string) {
  const doc = new PDFDocument({ size: "LETTER", margin: 0, info: { Title: "QR labels" } });
  doc.pipe(fs.createWriteStream(file));
  const side = 1.6 * IN;
  const cellW = 1.9 * IN;
  const cellH = 2.0 * IN;
  const cols = 4;
  const rows = 5;
  const perPage = cols * rows;
  const startX = (8.5 * IN - cols * cellW) / 2;
  const startY = (11 * IN - rows * cellH) / 2;
  tags.forEach((t, i) => {
    const slot = i % perPage;
    if (i > 0 && slot === 0) doc.addPage();
    const x = startX + (slot % cols) * cellW + (cellW - side) / 2;
    const y = startY + Math.floor(slot / cols) * cellH + 6;
    const qr = QRCode.create(`${base}/t/${t.code}`, { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    const m = side / (n + 8);
    doc.rect(x, y, side, side).lineWidth(0.3).stroke("#bbbbbb");
    doc.fillColor("#000000");
    for (let yy = 0; yy < n; yy++) {
      for (let xx = 0; xx < n; xx++) {
        if (qr.modules.data[yy * n + xx]) doc.rect(x + (xx + 4) * m, y + (yy + 4) * m, m + 0.02, m + 0.02).fill();
      }
    }
    doc.font("Courier-Bold").fontSize(9).fillColor("#222222").text(t.code, x, y + side + 4, { width: side, align: "center", lineBreak: false });
  });
  doc.end();
}

function cardsPdf(file: string, tags: { code: string; pin: string }[], base: string) {
  const doc = new PDFDocument({ size: "LETTER", margin: 0, info: { Title: "TagBack activation cards" } });
  doc.pipe(fs.createWriteStream(file));
  const w = 3.5 * IN;
  const h = 2 * IN;
  const startX = (8.5 * IN - 2 * w) / 2;
  const startY = 0.5 * IN;
  tags.forEach((t, i) => {
    const slot = i % 10;
    if (i > 0 && slot === 0) doc.addPage();
    const x = startX + (slot % 2) * w;
    const y = startY + Math.floor(slot / 2) * h;
    doc.rect(x, y, w, h).lineWidth(0.4).stroke("#999999");
    doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(13).text("TagBack", x + 14, y + 12);
    doc.fillColor(INK).font("Helvetica").fontSize(8.5).text("Scan your sticker, or go to", x + 14, y + 34);
    doc.font("Helvetica-Bold").text(`${base.replace(/^https?:\/\//, "")}/activate`, x + 14, y + 45);
    doc.font("Helvetica").fontSize(8.5).text("Tag code", x + 14, y + 68);
    doc.font("Courier-Bold").fontSize(16).text(t.code, x + 14, y + 79);
    doc.font("Helvetica").fontSize(8.5).text("Activation PIN", x + 14, y + 105);
    doc.font("Courier-Bold").fontSize(16).text(t.pin, x + 14, y + 116);
    doc.font("Helvetica").fontSize(7).fillColor("#555555").text("Keep this card until you activate your tag.", x + 14, y + 150, { width: w - 28 });
  });
  doc.end();
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const base = appUrl();
  if (base.includes("localhost")) {
    console.warn("\nWARNING: APP_URL is localhost. QR codes printed now will not work for customers.\n         Set APP_URL to your real domain before ordering stickers.\n");
  }
  const tags = a.offline ? generateCodes(a.count) : await createTags(a.count, a.kind, a.batch);
  const dir = path.join(a.out, a.batch);
  fs.mkdirSync(dir, { recursive: true });

  stickersPdf(path.join(dir, "stickers.pdf"), tags, a, base);
  cardsPdf(path.join(dir, "cards.pdf"), tags, base);
  qrLabelsPdf(path.join(dir, "qr-labels.pdf"), tags, base);
  fs.writeFileSync(
    path.join(dir, "codes.csv"),
    ["code,pin,url", ...tags.map((t) => `${t.code},${t.pin},${base}/t/${t.code}`)].join("\n") + "\n",
  );

  const cfg = KINDS[a.kind].print;
  const mirrored = a.mirror && cfg.surface === "inside-glass";
  if (a.mirror && !mirrored) console.warn(`Note: --mirror ignored, ${a.kind} stickers go on the outside surface.`);
  console.log(`${a.offline ? "Generated" : "Created"} ${tags.length} ${KINDS[a.kind].name.toLowerCase()} tags in batch "${a.batch}"${mirrored ? " (mirrored for inside-glass)" : ""}.`);
  console.log(`  Size ${cfg.wIn}x${cfg.hIn} in. Ask the printer for: ${cfg.material}.`);
  console.log(`  ${path.join(dir, "stickers.pdf")}`);
  console.log(`  ${path.join(dir, "cards.pdf")}`);
  console.log(`  ${path.join(dir, "qr-labels.pdf")}`);
  console.log(`  ${path.join(dir, "codes.csv")}  (contains PINs: keep private)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
