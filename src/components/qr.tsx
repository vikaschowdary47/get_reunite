import QRCode from "qrcode";

/** Server-rendered, vector QR code. One path, crisp at any size, no client JS. */
export function QrSvg({
  value,
  label,
  className,
  quiet = 4,
}: {
  value: string;
  label: string;
  className?: string;
  quiet?: number;
}) {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const data = qr.modules.data;
  let d = "";
  for (let y = 0; y < n; y++) {
    let x = 0;
    while (x < n) {
      if (data[y * n + x]) {
        let run = 1;
        while (x + run < n && data[y * n + x + run]) run++;
        d += `M${x + quiet} ${y + quiet}h${run}v1h-${run}z`;
        x += run;
      } else x++;
    }
  }
  const size = n + quiet * 2;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={size} height={size} fill="#fff" />
      <path d={d} fill="#101820" />
    </svg>
  );
}
